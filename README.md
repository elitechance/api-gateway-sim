# api-gateway-phi
AWS API Gateway simulator and Lambda (Node JS)

To run, you need to export your configuration from AWS API Gateway.  See [Export an API from Api Gateway](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-export-api.html)

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

Features
---------

* Supports Body Mapping Templates
* Continues to monitoring changes in your lambda code.  YES! No need to restart **_ags_**
* CORS - enabled by default

@TODOS
------
* Set proper CORS configuration define in swagger file
