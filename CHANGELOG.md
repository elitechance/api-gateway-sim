# Change log
1.2.20
* Bug fix on proxy and non proxy request body parsing
* Bug fix when request body is empty
* Add tslint.json
* Fix code format and follow tslint

1.2.19
* Support for headers in proxy response

1.2.18
* Fix httpMethod in proxy

1.2.17
* Fix error object handling

1.2.16
* Support proxy with empty ID
* Support for proxy query string

1.2.15
* Simulate error body during callback(new Error());

1.2.14
* Fix proxy error handling

1.2.13
* Remove event.context in proxy passthrough

1.2.12
* Support for raw headers in proxy passthrough

1.2.11
* Fix proxy passthrough data

1.2.10
* Update templates/pass-through.vtl
* Support `context.user-agent`
* Support for `context.stage`
* Bug fix `$input.json('$')` parsing

1.2.9
* Add support for non json body content

1.2.8
* Fix request template for {proxy+}
* Support for custom proxy name
* Support for requestContext for {proxy+}

1.2.7
* Add null check on open api library

1.2.6
* Fix base path pattern to only remove when it's enabled in command line
* Fix lambda context content merging

1.2.4
* Refactor Config class to OpenApi
* Support for custom header in {proxy+}

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
