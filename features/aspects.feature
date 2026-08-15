Feature: Aspects between bodies
  As a developer rendering a chart
  I want orbs that mean what astrologers mean by orb
  So that the aspects I show as strong actually are

  # 1.x reported the fractional part of the raw separation, so a trine at
  # 118.5° gave an orb of 0.5 rather than 1.5 — the aspect looked three times
  # tighter than it was. See spec §8.

  Scenario Outline: An orb is the distance from exactness
    Given two bodies at <first> and <second> degrees
    When the aspect between them is calculated
    Then the aspect is a <type>
    And the orb is <orb> degrees

    Examples:
      | first | second | type       | orb |
      | 0     | 118.5  | trine      | 1.5 |
      | 0     | 121.0  | trine      | 1.0 |
      | 10    | 100    | square     | 0.0 |
      | 358   | 3      | conjunct   | 5.0 |
      | 0     | 174.5  | opposition | 5.5 |

  Scenario: Two bodies not in aspect is an answer, not an error
    # 1.x threw for the ordinary case of two planets not in aspect — most pairs
    # in every chart — and callers swallowed the exception, which made genuine
    # faults invisible.
    Given two bodies at 0 and 20 degrees
    When the aspect between them is calculated
    Then there is no aspect between them

  Scenario: A minor aspect is recognized when no major one is in range
    Given two bodies at 0 and 45.5 degrees
    When the aspect between them is calculated
    Then the aspect is a semisquare
    And the orb is 0.5 degrees

  Scenario: Separation is measured along the shorter arc
    Given two bodies at 350 and 10 degrees
    When their separation is calculated
    Then the separation is 20 degrees
