# Change log

1.2.3
* Support for integration type "aws_proxy"
    - Set proper error message base on statusCode value
    - Return Internal Server Error if unknown variables are set in response
* Support for pass through behavior "when_no_match" and "never"
* Support for route path in "context"

1.2.2
* AGS UI: Support `event` variable value parsing status 
* Include transpiled js files for lib/aws/gateway/config**

1.2.1
* Add support for {proxy+}

1.2.0
* Support for strict CORS
* Refactor Api Gateway config parsing using Config class

1.1.5
* Support for base path

1.1.4
* Fix ags modules

1.1.3
* Fix AGS UI modules when you run it the first time.

1.1.0
* AGS CLI: Add AGS UI `$ ags -a`
* AGS CLI: Add AGS_PORT
* AGS CLI: Support configurable ports through cli argument
* AGS UI: AGS initial web application.
* AGS UI: Features body template parsing
* AGS UI: Sample templates
