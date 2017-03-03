# api-gateway-sim
AWS API Gateway simulator for Node JS Lambda

Install
```bash
$ npm install -g api-gateway-sim
```

To run, you need to export your configuration from AWS API Gateway console.
Choose **"Export as Swagger + API Gateway Integrations"**.
![alt text](http://docs.aws.amazon.com/apigateway/latest/developerguide/images/export-console.png)

See details in [Export an API from Api Gateway](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-export-api.html)

Running the simulator using **_ags_** cli
```bash
$ cd <node lambda directory>
$ ags --swagger <exported swagger json file>.json

```

Testing your lambda
```bash
$ curl http://localhost:3000/
```

Using different listening port
```bash
$ PORT=4000 ags --swagger <file>.json
```

Command Line Help
```bash
  Usage: ags [options]

  Options:

    -h, --help                    output usage information
    -V, --version                 output the version number
    -s, --swagger <file>          Swagger config file
    -e, --event <file>            Default file event.json
    -c, --context <file>          Default file context.json file
    -t, --stage-variables <file>  Default file stage-variables.json file
```

Features
---------

* Supports Body Mapping Templates
* Supports integration responses
* Supports event.json, context.json, and stage-variables.json
* Continues to monitoring changes in your lambda code.  YES! No need to restart **_ags_**
* Support for json or yaml swagger file.
* Monitor changes in event.json, context.json, and stage-variables.json
* CORS - enabled by default

@TODOS
------
* Set proper CORS configuration define in swagger file
