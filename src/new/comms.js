/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import {
    Context
} from './context'

export class Communications extends Context {
    constructor(ctx) {
        super(ctx)

        this.errornotification = null;
        this.clearErrorTimer = null;
        this.connectCountdownTimer = null;
        this.connectCountdown = 10;
        this.subscriptions = {};
        // ws;
        this.pendingAuth = false;
        this.reconnectAttempts = 0;
        this.active = false;
    }

    connect() {
        this.active = true;
        let location = this.location // fix

        var path = location.hostname;
        var port = location.port;
        if (port.length !== 0) {
            path = path + ":" + port;
        }
        path = path + document.location.pathname;
        path = path + (path.slice(-1) == "/" ? "" : "/") + "comms";
        path = "ws" + (document.location.protocol == "https:" ? "s" : "") + "://" + path;

        var auth_tokens = RED.settings.get("auth-tokens");
        pendingAuth = (auth_tokens != null);

        let subscriptions = this.subscriptions

        function completeConnection() {
            for (var t in subscriptions) {
                if (subscriptions.hasOwnProperty(t)) {
                    ws.send(JSON.stringify({
                        subscribe: t
                    }));
                }
            }
        }
        let ws = this.ws
        ws = new WebSocket(path);
        ws.onopen = function () {
            reconnectAttempts = 0;
            if (errornotification) {
                clearErrorTimer = setTimeout(function () {
                    errornotification.close();
                    errornotification = null;
                }, 1000);
            }
            if (pendingAuth) {
                ws.send(JSON.stringify({
                    auth: auth_tokens.access_token
                }));
            } else {
                completeConnection();
            }
        }
        ws.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            if (pendingAuth && msg.auth) {
                if (msg.auth === "ok") {
                    pendingAuth = false;
                    completeConnection();
                } else if (msg.auth === "fail") {
                    // anything else is an error...
                    active = false;
                    RED.user.login({
                        updateMenu: true
                    }, function () {
                        connectWS();
                    })
                }
            } else if (msg.topic) {
                for (var t in subscriptions) {
                    if (subscriptions.hasOwnProperty(t)) {
                        var re = new RegExp("^" + t.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g, "\\$1").replace(/\+/g, "[^/]+").replace(/\/#$/, "(\/.*)?") + "$");
                        if (re.test(msg.topic)) {
                            var subscribers = subscriptions[t];
                            if (subscribers) {
                                for (var i = 0; i < subscribers.length; i++) {
                                    subscribers[i](msg.topic, msg.data);
                                }
                            }
                        }
                    }
                }
            }
        };
        ws.onclose = function () {
            if (!active) {
                return;
            }
            if (clearErrorTimer) {
                clearTimeout(clearErrorTimer);
                clearErrorTimer = null;
            }
            reconnectAttempts++;
            if (reconnectAttempts < 10) {
                setTimeout(connectWS, 1000);
                if (reconnectAttempts > 5 && errornotification == null) {
                    errornotification = RED.notify(RED._("notification.errors.lostConnection"), "error", true);
                }
            } else if (reconnectAttempts < 20) {
                setTimeout(connectWS, 2000);
            } else {
                connectCountdown = 60;
                connectCountdownTimer = setInterval(function () {
                    connectCountdown--;
                    if (connectCountdown === 0) {
                        errornotification.update(RED._("notification.errors.lostConnection"));
                        clearInterval(connectCountdownTimer);
                        connectWS();
                    } else {
                        var msg = RED._("notification.errors.lostConnectionReconnect", {
                            time: connectCountdown
                        }) + ' <a href="#">' + RED._("notification.errors.lostConnectionTry") + '</a>';
                        errornotification.update(msg);
                        $(errornotification).find("a").click(function (e) {
                            e.preventDefault();
                            errornotification.update(RED._("notification.errors.lostConnection"));
                            clearInterval(connectCountdownTimer);
                            connectWS();
                        })
                    }
                }, 1000);
            }

        }
    }

    subscribe(topic, callback) {
        let subscription = this.subscriptions[topic]
        if (subscription === null) {
            subscription = [];
        }
        subscription.push(callback);
        if (ws && ws.readyState == 1) {
            ws.send(JSON.stringify({
                subscribe: topic
            }));
        }
    }

    unsubscribe(topic, callback) {
        let subscription = this.subscriptions[topic]
        if (subscription) {
            for (var i = 0; i < subscription.length; i++) {
                if (subscription[i] === callback) {
                    subscription.splice(i, 1);
                    break;
                }
            }
            if (subscription.length === 0) {
                delete subscriptions[topic];
            }
        }
    }
}
