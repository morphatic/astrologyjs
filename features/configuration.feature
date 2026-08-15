Feature: Configuration and failure messages
  As a developer hitting a problem
  I want the error to say what went wrong and what to do about it
  So that I do not spend six years guessing, as 1.x's users did

  Background:
    Given a birth at "1990-06-15T14:30" local time in Greenwich

  Scenario: A missing API key says so, and says where to get one
    Given no API key is configured
    When a natal chart is built
    Then it fails with a configuration error
    And the message mentions how to obtain an API key

  Scenario: A non-JSON response is reported as a transport failure
    # This is the 1.x failure named properly. The dead endpoint answered with an
    # nginx redirect page, the library parsed it as JSON, and every user saw
    # "Unexpected token <" with no hint that the service was gone.
    Given the ephemeris endpoint returns an HTML redirect page
    When a natal chart is built
    Then it fails with a transport error
    And the message does not say "Unexpected token"
    And the message includes the first bytes of what came back

  Scenario: A place given as text without a geocoder is refused clearly
    # 1.x called Google Maps behind the caller's back, which now needs billing.
    Given no geocoder is configured
    When a person is created with the place given as text
    Then it fails with a configuration error
    And the message says the library ships no geocoder

  Scenario Outline: Upstream failures map to catchable error types
    Given the ephemeris endpoint returns HTTP <status>
    When a natal chart is built
    Then it fails with a <error>

    Examples:
      | status | error                      |
      | 401    | authentication error       |
      | 402    | insufficient credits error |
      | 403    | origin error               |
      | 429    | rate limit error           |
