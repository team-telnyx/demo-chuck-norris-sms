// ==================================== Telnyx Solutions ===================================

// Description:
// Basic App that allows you to fetch ridiculous Chuck Norris jokes over SMS.
// This application demonstrates how to make use of Telnyx Inbound and Outbound SMS API capabilities.

// Author:
// Filipe Leitão (filipe@telnyx.com)

// Application:
//const g_appName = "telnyx-chuck-norris";

// ======= Conventions =======
// = g_xxx: global variable
// = f_xxx: function variable
// = l_xxx: local variable
// ===========================

// ============================================================================================


var express = require('express');
var request = require('request');
var fs = require("fs");
var cron = require('node-cron');


var g_debug = true;

// =============== Telnyx Account & App Settings ===============

var configs = fs.readFileSync("telnyx-chucknorris-config.json");
var jsonConfigs = JSON.parse(configs);

// Generic App Details
const g_telnyx_api_auth_v2 = jsonConfigs.telnyx_api_auth_v2;
const g_telnyx_app_users_db = jsonConfigs.g_telnyx_app_users_db;

// Voice Settings (for prompt dial and automated message)
const g_ivr_voice = jsonConfigs.voice.tts_voice;
const g_ivr_language = jsonConfigs.voice.tts_language;
const g_origin_number_voice = jsonConfigs.voice.from_number;
const g_telnyx_connection_id = jsonConfigs.voice.telnyx_connection_id;

// SMS Settings
const g_origin_number_sms = jsonConfigs.sms.from_number;

// =============== RESTful API Creation ===============

var rest = express();

// to parse json body
rest.use(express.json());


// ================================================ AUXILIARY FUNCTIONS  ================================================

function get_timestamp() {

    var now = new Date();

    return 'utc|' + now.getUTCFullYear() +
        '/' + (now.getUTCMonth() + 1) +
        '/' + now.getUTCDate() +
        '|' + now.getHours() +
        ':' + now.getMinutes() +
        ':' + now.getSeconds() +
        ':' + now.getMilliseconds();

}


// ============================================== CALL CONTROL API  ==============================================


// TELNYX CALL CONTROL API - Answer Call

function call_control_answer_call(f_telnyx_api_auth_v2, f_call_control_id, f_client_state_s) {

    var l_cc_action = 'answer';

    var l_client_state_64 = null;

    if (f_client_state_s)
        l_client_state_64 = Buffer.from(f_client_state_s).toString('base64');


    var options = {
        url: 'https://api.telnyx.com/v2/calls/' +
            f_call_control_id +
            '/actions/' +
            l_cc_action,

        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + f_telnyx_api_auth_v2
        },
        json: {
            client_state: l_client_state_64
        }
    };

    request.post(options, function (err, resp, body) {
        if (err) {
            return console.log(err);
        }

        if (g_debug)
            console.log("[%s] DEBUG - Command Executed [%s]", get_timestamp(), l_cc_action);
        console.log(body);
    });
}


// TELNYX CALL CONTROL API -  Hangup

function call_control_hangup(f_telnyx_api_auth_v2, f_call_control_id) {

    var l_cc_action = 'hangup';

    var options = {
        url: 'https://api.telnyx.com/v2/calls/' +
            f_call_control_id +
            '/actions/' +
            l_cc_action,

        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + f_telnyx_api_auth_v2
        },
        json: {}
    };

    request.post(options, function (err, resp, body) {
        if (err) {
            return console.log(err);
        }
        if (g_debug)
            console.log("[%s] DEBUG - Command Executed [%s]", get_timestamp(), l_cc_action);
        console.log(body);
    });
}

// TELNYX CALL CONTROL API -  Dial

function call_control_dial(f_telnyx_api_auth_v2, f_dest, f_from, f_connection_id) {

    var l_cc_action = 'dial';

    var options = {
        url: 'https://api.telnyx.com/v2/calls/',

        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + f_telnyx_api_auth_v2
        },
        json: {
            to: f_dest,
            from: f_from,
            connection_id: f_connection_id,
        }
    };

    request.post(options, function (err, resp, body) {
        if (err) {
            return console.log(err);
        }
        if (g_debug)
            console.log("[%s] DEBUG - Command Executed [%s]", get_timestamp(), l_cc_action);
        console.log(body);

    });
}



// TELNYX CALL CONTROL API - SPEAK
function call_control_speak(f_telnyx_api_auth_v2, f_call_control_id, f_tts_text) {

    var cc_action = 'speak'

    var options = {
        url: 'https://api.telnyx.com/v2/calls/' +
            f_call_control_id +
            '/actions/' +
            cc_action,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + f_telnyx_api_auth_v2
        },
        json: {
            payload: f_tts_text,
            voice: g_ivr_voice,
            language: g_ivr_language
        }
    };

    request.post(options, function (err, resp, body) {
        if (err) {
            return console.log(err);
        }
        if (g_debug)
            console.log("[%s] DEBUG - Command Executed [%s]", get_timestamp(), cc_action);
        console.log(body);
    });
}


// ============================================== SMS API  ==============================================


// TELNYX MESSAGING API - Send SMS

function send_sms(f_telnyx_api_auth_v2, f_dest, f_orig, f_message, f_callback) {

    var l_cc_action = 'send_sms'

    if (g_debug) {
        console.log("[%s] DEBUG - sending message to [%s]", get_timestamp(), f_dest);
        console.log("[%s] DEBUG - sending message from [%s]", get_timestamp(), f_orig);
        console.log("[%s] DEBUG - sending message with text [%s]", get_timestamp(), f_message);
    }

    var options = {
        url: 'https://api.telnyx.com/v2/messages',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + f_telnyx_api_auth_v2
        },
        json: {
            from: f_orig,
            to: f_dest,
            text: f_message
        }
    };

    request.post(options, function (err, resp, body) {

        if (err) {
            return console.log(err);
        }

        if (g_debug) {
            console.log("[%s] DEBUG - Command Executed [%s]", get_timestamp(), l_cc_action);
            console.log(body);
        }

        if (body.data && body.data.to[0].status == 'queued') {
            if (g_debug)
                console.log("[%s] DEBUG - queued status [%s]", get_timestamp(), body.data.to[0].status);
            f_callback(err, 1);
        } else {
            if (g_debug)
                console.log("[%s] DEBUG - message delivery failed!", get_timestamp());
            f_callback(err, 0);
        }

    });

}


// ============================================= Subscribers List Management  ============================================


// == > add_subscriber / returns (0/1) / 0 = subscriber already exists / 1 = success

function chuck_add_subscriber(f_new_number, f_new_carrier, f_telnyx_number, f_callback) {

    if (g_debug)
        console.log("[%s] DEBUG - Adding new subscriber [%s]", get_timestamp(), f_new_number);

    fs.readFile(g_telnyx_app_users_db, 'utf8', function (err, data) {

        if (err)
            f_callback(err, false);

        var obj = {
            subscribers: []
        };

        if (g_debug)
            console.log("[%s] DEBUG - Result of File [%s]", get_timestamp(), obj);

        obj = JSON.parse(data); //conver it to an object

        //  check if user is already on the list
        if (obj.hasOwnProperty(f_new_number)) {

            console.log("[%s] LOG - Double subscription attempt: %s", get_timestamp(), f_new_number);

            f_callback(err, false);

        } else {

            // new user, so add number to the list

            obj[f_new_number] = {
                created: get_timestamp(),
                user_info: {
                    number: f_new_number,
                    carrier: f_new_carrier
                },
                sms_info: {
                    telnyx_number: f_telnyx_number,
                }
            };

            fs.writeFile(g_telnyx_app_users_db, JSON.stringify(obj), 'utf8', function (err, data) {

                if (err)
                    f_callback(err, false);

                console.log("[%s] LOG - new subscriber added: %s ", get_timestamp(), f_new_number);
                f_callback(err, true);

            });

        }

    });

}

// == > delete_subscriber / returns (0/1) / 0 = some issue / 1 = success

function chuck_delete_subscriber(f_number_to_remove, f_callback) {

    fs.readFile(g_telnyx_app_users_db, 'utf8', function (err, data) {

        if (err)
            f_callback(err, false);

        var obj = {
            subscribers: []
        };

        var obj = JSON.parse(data);


        if (obj.hasOwnProperty(f_number_to_remove)) {

            delete obj[f_number_to_remove];

            fs.writeFile(g_telnyx_app_users_db, JSON.stringify(obj), 'utf8', function (write_err, write_data) {

                if (write_err)
                    f_callback(err, false);

                console.log("[%s] LOG - subscriber removed: %s ", get_timestamp(), f_number_to_remove);
                f_callback(err, true);

            });

        } else {

            console.log("[%s] LOG - subscriber does not exist: %s ", get_timestamp(), f_number_to_remove);
            f_callback(err, false);

        }

    });


}

// ============================================= Chuck Norris API  ============================================

function get_chuck_norris_joke(f_callback) { // returns string of text

    var l_chuck_api = "https://api.chucknorris.io/jokes/random";

    request(l_chuck_api, function (err, resp, body) {

        if (err) {
            return console.log(err);
        }
        console.log("[%s] LOG - calling chucknorris.io...", get_timestamp());

        if (g_debug) {
            console.log("[%s] DEBUG - chucknorris.io result: ", get_timestamp());
            console.log(JSON.parse(body));
        }

        var l_resultinjson = JSON.parse(body);

        var l_sms_success = (l_resultinjson.status == 'queued');

        f_callback(err, l_resultinjson.value);

    });
}

// #######################  Get Chuck Norris Quote as JSON #######################
// #
// # Typical Response Format:
// #
// # {'category': None,
// #  'icon_url': 'https://assets.chucknorris.host/img/avatar/chuck-norris.png',
// #  'id': 'Ziyk6Vi5TqCscqxWsuR8Lg',
// #  'url': 'https://api.chucknorris.io/jokes/Ziyk6Vi5TqCscqxWsuR8Lg',
// #  'value': 'Chuck Norris once started a fire with only what was around him. '
// #           'He was on an iceberg.'}
// #
// ###############################################################################


// ================================================ Scheduled SMS Blaster  ================================================

function chuck_blast_jokes(f_callback) {

    var nr_sent = 0;

    get_chuck_norris_joke(function (err, l_new_chuck_norris_joke) {

        if (l_new_chuck_norris_joke) {

            var l_text_to_send = l_new_chuck_norris_joke +
                ' | Done with jokes? Reply with `chuck-out` to unsubscribe.'

            console.log("[%s] LOG - new joke fetched, going to blast now...", get_timestamp());

            fs.readFile(g_telnyx_app_users_db, 'utf8', function (err, data) {

                if (err) {
                    console.log("[%s] LOG - ERROR - message broadcast failed", get_timestamp(), nr_sent);
                    f_callback(err, 0);
                }

                data = JSON.parse(data);

                for (var subscriber in data) {

                    send_sms(g_telnyx_api_auth_v2, data[subscriber].user_info.number, data[subscriber].sms_info.telnyx_number, l_text_to_send, function (sms_err, sms_res) {
                        console.log("[%s] LOG - joke sent to: %s", get_timestamp(), data[subscriber].user_info.number);
                    });

                    nr_sent++;
                }

                console.log("[%s] LOG - broadcasted to %s users", get_timestamp(), nr_sent);
                f_callback(err, nr_sent);

            });

        } else {
            console.log("[%s] LOG - ERROR - message broadcast failed", get_timestamp(), nr_sent);
            f_callback(err, 0);
        }

    });


}

// run the job every day at 8:30
var g_blast_jokes = cron.schedule('30 8 * * *', () => {

    console.log("[%s] LOG - scheduled broadcast to 10:15 Chicago Time...", get_timestamp());
    chuck_blast_jokes(function (err, l_sms_sent) {});

}, {
    timezone: "America/Chicago"
});



// ================================================ Inbound SMS Handling  ================================================


// POST - Digest Incoming SMS: https://<webhook_domain>:8081/chuck-norris/sms


rest.post('/chuck-norris/sms', function (req, res) {


    if (req && req.body && req.body.data.event_type) {

        var l_hook_event_type = req.body.data.event_type;

        if (l_hook_event_type == 'message.received') {

            var l_ib_from_number = req.body.data.payload.from.phone_number;
            var l_ib_dest_number = req.body.data.payload.to;
            var l_ib_msg_payload = req.body.data.payload.text;
            var l_ib_carrier = req.body.data.payload.from.carrier;

            console.log("[%s] LOG - New SMS Received / from [%s] / to [%s]/ text[%s]",
                get_timestamp(), l_ib_from_number, l_ib_dest_number, l_ib_msg_payload);
            if (g_debug)
                console.log("[%s] DEBUG - Webhook received - complete payload: %s", get_timestamp(),
                    JSON.stringify(req.body, null, 4));


            //            !!!! IMPORTANT: do not forget to append the 'chuck-out' option to any outbound chuck fact !!!!


            if (l_ib_msg_payload == 'chuck-in' || l_ib_msg_payload == 'Chuck-in') {

                // adds subscriber to the user list

                console.log("[%s] LOG - Chuck-In received from: %s", get_timestamp(), l_ib_from_number);

                chuck_add_subscriber(l_ib_from_number, l_ib_carrier, l_ib_dest_number, function (add_err, add_res) {

                    if (!add_res) {
                        var l_reply_text = "Ups, looks like we already have you on the list. You can always opt out with a 'chuck-out' reply.";

                        send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_reply_text, function (sms_err, sms_res) {
                            if (g_debug)
                                console.log("[%s] DEBUG - Send SMS Result [%s]", get_timestamp(), sms_res);
                        });

                    } else {
                        var l_reply_text = 'You are now subscribed to the most stupid and useless Chuck Norris jokes. ' +
                            'Reply with `chuck-out` to unsubscribe.';

                        send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_reply_text, function (sms_err, sms_res) {
                            if (g_debug)
                                console.log("[%s] DEBUG - Send SMS Result [%s]", get_timestamp(), sms_res);
                        });

                    }

                });

            } else if (l_ib_msg_payload == 'chuck-out' || l_ib_msg_payload == 'Chuck-out') {

                // removes subscriber from the user list

                console.log("[%s] LOG - Chuck-Out received from: %s", get_timestamp(), l_ib_from_number);

                chuck_delete_subscriber(l_ib_from_number, function (del_err, del_res) {

                    if (!del_res) {
                        var l_reply_text = "Ups, looks like could not process your request. ";

                        send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_reply_text, function (sms_err, sms_res) {
                            if (g_debug)
                                console.log("[%s] DEBUG - Send SMS Result [%s]", get_timestamp(), sms_res);
                        });

                    } else {

                        var l_reply_text = 'You just unsubscribed to Chuck Norris jokes. ' +
                            'Reply with `chuck-in` to subscribe again.';

                        send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_reply_text, function (sms_err, sms_res) {
                            if (g_debug)
                                console.log("[%s] DEBUG - Send SMS Result [%s]", get_timestamp(), sms_res);
                        });

                    }

                });

            } else if (l_ib_msg_payload == 'chuck-now' || l_ib_msg_payload == 'Chuck-now') {

                // sends instant random joke over sms

                console.log("[%s] LOG - Chuck-Now received from: %s", get_timestamp(), l_ib_from_number);

                get_chuck_norris_joke(function (err, l_new_chuck_norris_joke) {

                    if (l_new_chuck_norris_joke) {
                        var l_text_to_send = l_new_chuck_norris_joke +
                            ' | Done with jokes? Reply with `chuck-out` to unsubscribe.'

                        send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_text_to_send, function (sms_err, sms_res) {
                            console.log("[%s] LOG - New joke sent to: %s", get_timestamp(), l_ib_from_number);
                            if (g_debug)
                                console.log("[%s] DEBUG - Send SMS Result [%s]", get_timestamp(), sms_res);
                        });

                    } else {
                        var l_text_to_send = 'Looks like Chuck ran out of jokes right now. ' +
                            'Please try again later or reply with chuck-out to unsubscribe.';

                        send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_text_to_send, function (sms_err, sms_res) {
                            console.log("[%s] LOG - Unnable to fetch joke!", get_timestamp());
                            console.log("[%s] LOG - Error Message Sent to: %s", get_timestamp(), l_ib_from_number);
                            if (g_debug)
                                console.log("[%s] DEBUG - Send SMS Result [%s]", get_timestamp(), sms_res);

                        });
                    }

                });

            } else if (l_ib_msg_payload == 'chuck-call' || l_ib_msg_payload == 'Chuck-call') {

                // sends instant random joke over voice call

                call_control_dial(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, g_telnyx_connection_id);


            } else {

                // sends a command not recognized message

                console.log("[%s] LOG - received an unrecognized command from [%s]: [%s]", get_timestamp(), l_ib_from_number, l_ib_msg_payload);


                var l_text_to_send = 'Sorry, looks like we are missing something here. Reply with `chuck-in` ' +
                    'to subscribe to daily (useless) Chuck Norris facts, `chuck-out` to ' +
                    'unsubscribe to the daily facts,  `chuck-now` to get an immediate Chuck Norris fact over SMS ' +
                    'or `chuck-call` to get one over a voice call.';

                send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_text_to_send, function (sms_err, sms_res) {
                    console.log("[%s] LOG - Error Message Sent to: %s", get_timestamp(), l_ib_from_number);
                });

            }

            res.end();


        } else if (l_hook_event_type == 'call.answered') { // ===========> Call Answered >> Read Joke

            get_chuck_norris_joke(function (err, l_new_chuck_norris_joke) {

                if (l_new_chuck_norris_joke) {

                    var l_text_to_send = l_new_chuck_norris_joke;

                    call_control_speak(g_telnyx_api_auth_v2, req.body.data.payload.call_control_id, l_new_chuck_norris_joke);


                } else {

                    var l_text_to_send = 'Looks like Chuck ran out of jokes right now. ' +
                        'Please try again later or reply with chuck-out to unsubscribe.';

                    send_sms(g_telnyx_api_auth_v2, l_ib_from_number, l_ib_dest_number, l_text_to_send, function (sms_err, sms_res) {
                        console.log("[%s] LOG - Unnable to fetch joke!", get_timestamp());
                        console.log("[%s] LOG - Error Message Sent to: %s", get_timestamp(), l_ib_from_number);

                    });
                }

            });

            res.end();

        } else if (l_hook_event_type == 'call.speak.ended') { // ===========> Speak Ended >> Terminate Call

            // Smoothly Terminates Call
            call_control_hangup(g_telnyx_api_auth_v2, req.body.data.payload.call_control_id);

            res.end();

        } else if (l_hook_event_type == 'call.hangup') { // ===========> Hangup >> Send Text

            var l_ib_from_number = req.body.data.payload.from;
            var l_ib_dest_number = req.body.data.payload.to;

            // Sends SMS for follow-up and opt-out

            var l_text_to_send = 'Hope you got the call and enjoyed the joke. ' +
                'Remember, you can send `chuck-out` to unsubscribe to the daily facts,' +
                '`chuck-now` to get an immediate Chuck Norris fact over SMS ' +
                'or `chuck-call` to get one over a voice call.';

            send_sms(g_telnyx_api_auth_v2, l_ib_dest_number, l_ib_from_number, l_text_to_send, function (sms_err, sms_res) {
                if (sms_res) {
                    console.log("[%s] LOG - Message Sent to: %s", get_timestamp(), l_ib_dest_number);
                } else {
                    console.log("[%s] LOG - Message Delivery failed to: %s", get_timestamp(), l_ib_dest_number);
                }

            });

            res.end();

        } else { // ===========> Anything Else >> 200ok

            res.end();

        }

    } else {
        console.log("[%s] LOG - Invalid Webhook received!", get_timestamp());
        res.end('0');
    }

});



// ================================================ Remote Control API  ================================================


// GET - Blast Jokes: https://<webhook_domain>:8081/chuck-norris/blast


rest.get('/chuck-norris/blast', function (req, res) {

    // run over the list and blast SMS to each subscriber

    console.log("[%s] LOG - message broadcast requested...", get_timestamp());


    chuck_blast_jokes(function (err, l_sms_sent) {

        if (err)
            res.end('ups... something went wrong and no joke was fetched...');

        if (l_sms_sent > 0)
            res.end('Chuck Norris Jokes sent to ' + l_sms_sent + ' subscribers.');
        else
            res.end('ups... something went wrong and no joke was fetched...');
    });

});


// GET - Add Subscriber: http: //<webhook_domain>:8081/chuck-norris/add?number=%2Bxxxxx

rest.get('/chuck-norris/add', function (req, res) {

    chuck_add_subscriber(req.query.number, 'unknown', g_origin_number_sms, function (add_err, add_res) {

        if (add_res)
            res.end("new subscriber added: " + req.query.number);
        else
            res.end("ups... looks like we were unable to add the new subscriber...");

    });

})


// GET - Delete Subscriber: http: //<webhook_domain>:8081/chuck-norris/delete?number=%2Bxxxxx

rest.get('/chuck-norris/delete', function (req, res) {

    chuck_delete_subscriber(req.query.number, function (del_err, del_res) {

        if (del_res)
            res.end("subscriber deleted: " + req.query.number);
        else
            res.end("ups... looks like we were unable to remove that subscriber right now...");

    });

})


// GET - Start Cron: http: //<webhook_domain>:8081/chuck-norris/cron-start

rest.get('/chuck-norris/cron-start', function (req, res) {

    console.log("[%s] LOG - CRON API Called...", get_timestamp());

    g_blast_jokes.start();

    console.log("[%s] WARNING - CRON IS NOW ACTIVATED !!", get_timestamp());
    res.end("cron activated at " + get_timestamp());

})


// GET - Stop Cron: http: //<webhook_domain>:8081/chuck-norris/cron-stop

rest.get('/chuck-norris/cron-stop', function (req, res) {

    console.log("[%s] LOG - CRON API Called...", get_timestamp());

    g_blast_jokes.stop();

    console.log("[%s] LOG - CRON is now deactivated...", get_timestamp());
    res.end("cron deactivated at " + get_timestamp());

})


// GET - Stop App: https://<webhook_domain>:8081/chuck-norris/stop

rest.get('/chuck-norris/stop', function (req, res) {
    console.log("Terminating Chuck Norris Demo...");
    process.exit(1)
})


// ================================================ Start Application   ================================================


var server = rest.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port


    console.log("[%s] LOG - initiating App...", get_timestamp());

    console.log("[%s] LOG - reading config file - `telnyx-chucknorris-config.json`", get_timestamp());

    console.log("[%s] LOG - reading config file - g_telnyx_api_auth_v2 = %s", get_timestamp(), g_telnyx_api_auth_v2);
    console.log("[%s] LOG - reading config file - g_telnyx_app_users_db = %s", get_timestamp(), g_telnyx_app_users_db);
    console.log("[%s] LOG - reading config file - g_ivr_voice = %s", get_timestamp(), g_ivr_voice);
    console.log("[%s] LOG - reading config file - g_ivr_language = %s", get_timestamp(), g_ivr_language);
    console.log("[%s] LOG - reading config file - g_origin_number_voice = %s", get_timestamp(), g_origin_number_voice);
    console.log("[%s] LOG - reading config file - g_telnyx_connection_id = %s", get_timestamp(), g_telnyx_connection_id);
    console.log("[%s] LOG - reading config file - g_origin_number_sms = %s", get_timestamp(), g_origin_number_sms);

    if (g_debug)
        console.log("[%s] WARNING - DEBUG mode is ON", get_timestamp());


    console.log("[%s] LOG - app listening at http://%s:%s", get_timestamp(), host, port)

});
