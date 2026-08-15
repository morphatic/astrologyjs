Feature: Resolving a birth time to an instant
  As a developer with birth data in the form it actually arrives
  I want a local wall-clock time and a place turned into an unambiguous instant
  So that the same code produces the same chart on my laptop and in a container

  # 1.x accepted a Date and called toISOString() on it, so the host process's
  # zone decided the chart. Neither run errored. See spec §5.

  Scenario: A local time resolves against the zone of the birthplace
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When the person is created
    Then the resolved zone is "Europe/London"
    And the resolved instant is "1990-06-15T13:30:00.000Z"
    And the applied UTC offset is 60 minutes

  Scenario: The offset is inspectable, not just the instant
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When the person is created
    Then the person reports which assumptions were used

  Scenario Outline: Zones that are not whole hours from UTC
    Given a birth at "<local>" local time in <place>
    When the person is created
    Then the applied UTC offset is <offset> minutes

    Examples:
      | local            | place     | offset |
      | 1995-04-10T09:15 | Kolkata   | 330    |
      | 1995-04-10T09:15 | Kathmandu | 345    |
      | 1995-04-10T09:15 | Adelaide  | 570    |

  Scenario: A time that occurred twice is refused rather than guessed
    # Clocks in New York went back at 02:00 on 2023-11-05, so 01:30 happened
    # in EDT and again in EST. Picking one silently is a plausible wrong number.
    Given a birth at "2023-11-05T01:30" local time in New York
    When the person is created
    Then creating the person fails with an ambiguous time error
    And the error offers 2 candidate instants

  Scenario: The caller resolves an ambiguous time by naming the offset
    Given a birth at "2023-11-05T01:30" local time in New York
    And the caller specifies a UTC offset of -240 minutes
    When the person is created
    Then the resolved instant is "2023-11-05T05:30:00.000Z"

  Scenario: A time that never happened is refused
    # Clocks went forward at 02:00 on 2023-03-12, so 02:30 does not exist.
    Given a birth at "2023-03-12T02:30" local time in New York
    When the person is created
    Then creating the person fails with a nonexistent time error

  Scenario: An unknown birth time still has a known birth date
    Given a birth on "1990-06-15" in Greenwich with the time unknown
    When the person is created
    Then the person is marked as having an unknown time
    And the resolved instant is noon local

  Scenario: A bare date-time string is refused because it carries no zone
    Given a birth time given as "1990-06-15T14:30:00Z" in the local field
    When the person is created
    Then creating the person fails with a validation error
