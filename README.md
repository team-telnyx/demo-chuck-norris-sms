# Telnyx Chuck Norris SMS Demo
Simple SMS Demo entirely based on Node.js and Telnyx APIv2 that interfaces with https://api.chucknorris.io/ so fans can subscribe to daily (stupid) Chuck Norris jokes. This app explores both Telnyx SMS and Voice API capabilities to deliver messages, phone calls and manage subscriptions.


This application shows you to:

1. Set up your development environment for sending SMS and making calls using Telnyx APIv2.
2. Build an SMS opt-in/opt-out application based on Node.js.


---

- [Usage](#usage)
- [Setup Your Application](#setup-your-application)
- [Run Your Application](#run-your-application)
- [Disclamer](#disclamer)

---

## Usage

There are two ways to interface with the application: (1) as a subscriber, that will rely on SMS to opt-in/out to the subscription list and pull jokes; (2) as an administrator, that will rely on a set of HTTP based commands to broadcast jokes, add/delete subscribers etc.

### Subscriber

From the end-user perspective you can perform the following actions:

- `chuck-in` to subscribe to the "joke" SMS distribution list
- `chuck-out` to unsubscribe to the "joke" SMS distribution list
- `chuck-now` to get an immediate "joke" over SMS
- `chuck-call` to get an immediate "joke" over a phone call


### Administration

For application admin puroposes functions were created so you can remotely control it. This way you are able to: broadcast jokes with `blast jokes` function; add and delete subscribers from the SMS list with `add/delete number`; start and stop the application cron process with `cron-start/stop`.


- `Blast Jokes`: https://<webhook_domain>:8081/chuck-norris/blast (HTTP GET)
- `Add Subscriber`: http: //<webhook_domain>:8081/chuck-norris/add?number=%2Bxxxxx (HTTP GET)
- `Delete Subscriber`: http: //<webhook_domain>:8081/chuck-norris/delete?number=%2Bxxxxx (HTTP GET)
- `Start Cron`: http: //<webhook_domain>:8081/chuck-norris/cron-start (HTTP GET)
- `Stop Cron`: http: //<webhook_domain>:8081/chuck-norris/cron-stop (HTTP GET)

By default, starting the `cron` process will make the application to broadcast messages over the list everyday at 8:30am Chicago Time. You can stop this by sending the `cron-stop` command or edit the following function on the code:

```js
// run the job every day at 8:30
var g_blast_jokes = cron.schedule('30 8 * * *', () => {

    console.log("[%s] LOG - scheduled broadcast to 10:15 Chicago Time...", get_timestamp());
    chuck_blast_jokes(function (err, l_sms_sent) {});

}, {
    timezone: "America/Chicago"
});

```

## Setup Your Application

This application comes with the following system files:

- `telnyx-chucknorris-sms.js`: the Node.js main application that includes Telnyx SMS and Voice API examples
- `telnyx-chucknorris-config.json`: where you can configure the API Key, numbers to use, etc.
- `telnyx-chucknorris-users.json`: the simple database structure where we keep the SMS broadcast list

### Your Telnyx Account Details

Before you start the application, you need to provide your Telnyx Account details to `telnyx-chucknorris-config.json` as well as important information for the normal application function:

```json
{
    "telnyx_api_auth_v2": "KEY016FC40155D65CA04656136B3882D9B0_XuyncNBL9z7guFoNkQMez9",
    "g_telnyx_app_users_db": "telnyx-chucknorris-users.json",
    "voice": {
        "tts_voice": "female",
        "tts_language": "en-US",
        "from_number": "+17732490555",
        "telnyx_connection_id": "1138319702024522049" 
    },
    "sms": {
        "from_number": "+17732490555"
    }
}
```

- `telnyx_api_auth_v2`: your Telnyx Authv2 API key that you can grab here: https://portal.telnyx.com/#/app/auth/v2
- `g_telnyx_app_users_db`: path to the JSON file used as SMS users list
- `tts_voice` and `tts_language`: settings to be used by Telnyx Text-To-Speech (TTS) engine
- `from_number`: the Telnyx number to be used either as default SMS Sender ID or Voice Caller ID in the app
- `telnyx_connection_id`: connection ID to be used for Call Control Dial command

Don't forget the buy the number and create a messaging profile on Telnyx Portal before you edit this file. Check our [Messaging Quick Guide](https://developers.telnyx.com/docs/v2/messaging/quickstarts/portal-setup) setup for details on how to go over those actions before running the app.


### Understanding the SMS User List

To manage the subscribers list we rely on a very simple JSON structure, where the index and `user_info.number` are the subscriber number, `telnyx_number` is the Telnyx number the subscriber used in the moment of `chuck-in` (because the app can expose as many numbers as necessary to the subscribers and we need to know which number to use back as Sender ID), `user_info.number` is just an informative information to indicate the origin of the number.

```js
{
    "+351939413420": {
        "created": "utc|2020/1/22|12:13:17:580",
        "user_info": {
            "number": "+351939413420",
            "carrier": "NOS Portugal"
        },
        "sms_info": {
            "telnyx_number": "+17732490560"
        }
    },
    "+491742464840": {
        "created": "utc|2020/1/22|14:20:45:211",
        "user_info": {
            "number": "+491742464840",
            "carrier": "Vodafone Germany"
        },
        "sms_info": {
            "telnyx_number": "+17732490560"
        }
    },
    "+17084769355": {
        "created": "utc|2020/1/22|17:14:47:138",
        "user_info": {
            "number": "+17084769355",
            "carrier": "The Sprint Group"
        },
        "sms_info": {
            "telnyx_number": "+17732490560"
        }
    }
}
```

## Run Your Application

### Prerequisites

1. Go through the Telnyx Setup Guide for [Messaging](https://developers.telnyx.com/docs/v2/messaging/quickstarts/portal-setup). 
2. You’ll need to have Node installed to continue. You can check this by running the following:

```shell
$ node -v
```

If Node isn’t installed, follow the [official installation instructions](https://nodejs.org/en/download/) for your operating system to install it.

You’ll need to have the following Node dependencies installed to run this application:

```js
require('express');
require('request');
require('fs');
require('node-cron');
```

If some is missing just run:

```shell
$ npm install <dependency-name>
```


### Lightning-Up the Application

```shell
$ node telnyx-chucknorris-sms.js 
```


## Disclamer
This applications builds just a connector to fecth content from `https://api.chucknorris.io/`.
Telnyx or any of its colaborators (including the ones who built this application) do not own, created or provided content on `https://api.chucknorris.io/`.
More about `chucknorris.io` can be found in https://api.chucknorris.io/#! and https://api.chucknorris.io/privacy
