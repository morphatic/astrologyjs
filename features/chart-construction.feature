Feature: Building a chart
  As a developer building astrology software
  I want a chart whose numbers are correct and whose assumptions are inspectable
  So that I can render it without second-guessing the library

  Background:
    Given the ephemeris is served from recorded fixtures

  Scenario: A natal chart from a person
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When a natal chart is built
    Then the chart has 20 bodies
    And the chart has 12 house cusps
    And the chart has an ascendant and a midheaven

  Scenario: Declination is computed, not copied from the response
    # Upstream returns ecliptic latitude in the declination field
    # (morphemeris#83), so the library derives both locally. See spec §6.5.
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When a natal chart is built
    Then the Sun's ecliptic latitude is near zero
    But the Sun's declination is more than 20 degrees

  Scenario: The south node is derived opposite the north node
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When a natal chart is built
    Then the south node is exactly 180 degrees from the north node
    And no aspect is reported between the north node and the south node

  Scenario: Building the same chart twice costs one request
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When a natal chart is built
    And a natal chart is built again
    Then the ephemeris was called 1 time

  Scenario: An unknown birth time omits the angles rather than inventing them
    # An ascendant sweeps the whole zodiac in 24 hours, so a noon value is not
    # an approximation of the true one — it is unrelated to it. Spec §5.3.
    Given a birth on "1990-06-15" in Greenwich with the time unknown
    When a natal chart is built
    Then the chart has no house cusps
    And the chart has no ascendant
    And the chart warns that the birth time was unknown

  Scenario: A caller who prefers the common noon convention can have it
    Given a birth on "1990-06-15" in Greenwich with the time unknown
    And the caller opts into the noon convention for unknown times
    When a natal chart is built
    Then the chart has 12 house cusps
    And the chart warns that noon was assumed

  Scenario: A synastry chart aspects one person's bodies against the other's
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    And a second birth at "1985-12-21T03:00" local time in Tromso
    When a synastry chart is built
    Then the chart has a second ring of bodies
    And every aspect crosses the two rings

  Scenario: A chart records the frame it was computed in
    Given a birth at "1990-06-15T14:30" local time in Greenwich
    When a natal chart is built
    Then the chart reports its house system and zodiac
