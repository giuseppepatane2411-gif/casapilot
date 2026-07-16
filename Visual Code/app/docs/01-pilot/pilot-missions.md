# =====================================================================
# PILOT MISSION ENGINE
# =====================================================================

Version: 2.0

Status: Core Architecture

Priority: CRITICAL

Owner: CasaPilot

Module: Pilot OS

=====================================================================

# CHAPTER 1

MISSION PHILOSOPHY

=====================================================================

## What is a Mission?

A Mission is the fundamental working unit of Pilot OS.

Pilot does not work with conversations.

Pilot does not work with prompts.

Pilot does not work with requests.

Pilot works only with Missions.

Every user objective is transformed into one or more Missions.

A Mission becomes the center of every decision made by the system.

Everything else exists to help a Mission progress.

---------------------------------------------------------------------

## Why Missions exist

Traditional software reacts.

Pilot anticipates.

Traditional software answers questions.

Pilot completes objectives.

Traditional software stores information.

Pilot transforms information into progress.

For this reason, the Mission is the most important object inside Pilot OS.

---------------------------------------------------------------------

## Mission First Architecture

Every component inside Pilot depends on a Mission.

Conversation

↓

belongs to

↓

Mission

--------------------------------------------

Document

↓

belongs to

↓

Mission

--------------------------------------------

Professional

↓

belongs to

↓

Mission

--------------------------------------------

Timeline

↓

belongs to

↓

Mission

--------------------------------------------

Memory

↓

belongs to

↓

Mission

--------------------------------------------

Checklist

↓

belongs to

↓

Mission

--------------------------------------------

Announcement

↓

belongs to

↓

Mission

Nothing exists outside a Mission.

---------------------------------------------------------------------

## Mission Philosophy

Pilot never asks:

"What did the user say?"

Pilot always asks:

"What is the user trying to achieve?"

Because objectives are stable.

Messages are temporary.

---------------------------------------------------------------------

## Mission Goal

Every Mission has only one goal.

One Mission.

One objective.

Examples.

Sell a property.

Rent a property.

Recover documents.

Create an announcement.

Publish an announcement.

Negotiate an offer.

Complete the deed.

Never mix objectives.

If two objectives exist,

Pilot creates two Missions.

---------------------------------------------------------------------

## Mission Ownership

Each Mission belongs to exactly one User.

A User can own many Missions.

Each Property can own many Missions.

Each Mission always belongs to exactly one Property.

---------------------------------------------------------------------

## Mission as a Living Object

A Mission is alive.

It changes.

It learns.

It evolves.

It can stop.

It can restart.

It can fail.

It can recover.

It can complete.

A Mission is never static.

---------------------------------------------------------------------

## Pilot Responsibility

Pilot has one responsibility.

Advance every active Mission.

Not answer.

Not chat.

Advance.

Every response must move at least one Mission forward.

If no Mission progresses,

Pilot has failed.

---------------------------------------------------------------------

## Golden Principle

Conversations create words.

Missions create results.

Pilot exists to create results.

=====================================================================

END OF CHAPTER 1

# =====================================================================
# CHAPTER 2
# MISSION OBJECT
# =====================================================================

## Overview

The Mission Object is the central entity of Pilot OS.

Every activity performed inside CasaPilot belongs to one Mission.

A Mission contains everything required to reach a single objective.

A Mission is not a checklist.

A Mission is an intelligent object capable of evolving over time.

---

# Mission Identity

Every Mission must have a unique identity.

MissionID
Unique identifier.

Immutable.

Never changes.

Example

MISSION-2A94B31

------------------------------------------------------------

MissionType

Defines the category.

Possible values

SELL_PROPERTY

RENT_PROPERTY

BUY_PROPERTY

PROPERTY_MANAGEMENT

PROPERTY_VALUATION

DOCUMENT_COLLECTION

PHOTO_SESSION

CREATE_ANNOUNCEMENT

PUBLISH_ANNOUNCEMENT

VISITS_MANAGEMENT

NEGOTIATION

PRELIMINARY_CONTRACT

FINAL_DEED

POST_SALE

------------------------------------------------------------

MissionName

Human readable name.

Example

Vendita appartamento Via Roma 18

------------------------------------------------------------

MissionDescription

Short explanation.

Example

Completare la vendita dell'immobile di Via Roma.

---

# Ownership

MissionOwnerID

User owner.

Exactly one.

------------------------------------------------------------

PropertyID

Property connected.

Exactly one.

------------------------------------------------------------

WorkspaceID

Every Mission belongs to a Workspace.

Usually the Property Workspace.

---

# Mission State

MissionStatus

Possible values

NEW

READY

ACTIVE

WAITING_USER

WAITING_DOCUMENTS

WAITING_PROFESSIONAL

WAITING_EXTERNAL

BLOCKED

COMPLETED

ARCHIVED

Only one status can exist.

------------------------------------------------------------

MissionPriority

CRITICAL

HIGH

NORMAL

LOW

BACKGROUND

Automatically calculated.

------------------------------------------------------------

MissionPhase

Represents where the Mission currently is.

Examples

Analysis

Preparation

Execution

Verification

Completion

---

# Mission Health

MissionHealth

0 → 100

Represents overall health.

Calculated automatically.

Never manually edited.

------------------------------------------------------------

Health Factors

Documentation

Timeline

Quality

Risk

Dependencies

Professionals

Automation

Each factor contributes to MissionHealth.

---

# Mission Confidence

Represents how confident Pilot is.

Range

0 → 100

Example

100

Everything known.

40

Many unknowns.

15

Pilot lacks information.

Low confidence increases questioning.

---

# Mission Complexity

Represents estimated complexity.

Values

Simple

Medium

Complex

Enterprise

Complexity changes automatically.

---

# Mission Risk

Risk Score

0 → 100

Generated continuously.

Factors.

Missing documents

Legal risks

Expired certificates

Timeline delays

Missing professionals

Incomplete property data

High risk changes Pilot behaviour.

Pilot becomes more proactive.

---

# Mission Timeline

CreatedAt

StartedAt

UpdatedAt

CompletedAt

ArchivedAt

All timestamps immutable once written.

---

# Mission Events

Every Mission owns an Event Log.

Examples.

Mission Created

↓

Property Connected

↓

APE Uploaded

↓

Photos Uploaded

↓

Professional Assigned

↓

Announcement Created

↓

Offer Received

↓

Contract Generated

↓

Deed Completed

Every Event remains forever.

Events are never deleted.

---

# Mission Memory

Each Mission has a private memory.

Stores.

Important decisions

Preferences

Problems

Solutions

AI observations

Professional notes

Memory survives conversations.

Memory belongs to the Mission.

Not to the Chat.

---

# Mission Documents

Mission contains references.

Never files.

Every document has.

DocumentID

Category

Status

Verification

Version

Expiration

Linked Professional

Every document has lifecycle.

---

# Mission Professionals

Mission knows every involved professional.

Example

Photographer

Surveyor

Engineer

Architect

Lawyer

Notary

Estate Agent

Cleaner

Mover

Each professional has.

Role

Status

Assigned Tasks

Availability

Feedback

---

# Mission Checklist

Checklist is dynamic.

Pilot may.

Add tasks.

Remove tasks.

Merge tasks.

Split tasks.

Reorder tasks.

Checklist is generated by AI.

Not manually predefined.

---

# Mission Opportunities

Pilot constantly generates opportunities.

Example.

Generate Announcement

↓

Request Valuation

↓

Schedule Photographer

↓

Recover Floorplan

↓

Optimize Asking Price

↓

Prepare Preliminary Contract

Opportunities disappear when completed.

---

# Mission Warnings

Warnings represent potential issues.

Examples.

APE missing.

↓

Floorplan outdated.

↓

Photos low quality.

↓

Advertisement incomplete.

↓

Property description inconsistent.

Warnings never stop a Mission.

Warnings help prioritization.

---

# Mission Dependencies

Mission may depend on others.

Example.

Property Valuation

↓

SELL_PROPERTY

↓

CREATE_ANNOUNCEMENT

↓

VISITS

↓

NEGOTIATION

↓

PRELIMINARY

↓

FINAL_DEED

Pilot always evaluates dependencies before executing actions.

---

# Mission Predictions

Pilot predicts future needs.

Examples.

Next required document.

↓

Possible delay.

↓

Likely professional.

↓

Expected completion date.

↓

Possible risks.

Predictions continuously evolve.

---

# Mission Intelligence

Mission contains AI-generated knowledge.

Pilot can infer.

Property readiness.

Seller behaviour.

Buyer engagement.

Missing information.

Probability of success.

Estimated effort.

Recommended next action.

Mission Intelligence grows over time.

---

# Mission Next Action

Every Mission MUST expose one single Next Action.

Examples.

Upload APE.

Book Photographer.

Review Announcement.

Accept Offer.

Schedule Visit.

Sign Preliminary Contract.

Only one Next Action is active.

Pilot always focuses user attention there.

---

# Mission Completion Rules

A Mission may only complete if.

Goal achieved.

No blocking issues.

Required documents verified.

Timeline closed.

Mandatory Events completed.

Final summary generated.

Otherwise Mission remains active.

---

# Mission Object Rule

The Mission Object is the source of truth.

Conversation is temporary.

Memory is supportive.

Documents are resources.

Professionals are collaborators.

The Mission is the only object that defines reality.

====================================================================

END OF CHAPTER 2

# =====================================================================
# CHAPTER 3
# MISSION BRAIN
# =====================================================================

## Overview

Every Mission owns its own Brain.

The Mission Brain is responsible for making operational decisions.

It continuously observes the Mission, evaluates its current situation and decides the best action to execute.

The Brain never sleeps.

Every Event activates it.

Every change activates it.

Every user interaction activates it.

The Mission Brain is the intelligence behind Pilot OS.

---

# Core Principle

A Mission never waits.

If the Mission is not progressing,
the Brain must understand why.

Every cycle has only one objective:

Reduce uncertainty.

Increase progress.

---

# Mission Brain Loop

The Brain executes the same cycle forever.

```

Read Mission

↓

Read Events

↓

Read Memory

↓

Read Documents

↓

Read Property

↓

Read Professionals

↓

Read Rules

↓

Evaluate Risks

↓

Evaluate Opportunities

↓

Evaluate Dependencies

↓

Calculate Mission Health

↓

Select Next Action

↓

Update Mission

↓

Wait for next Event

```

This loop never changes.

Every future feature must integrate into this cycle.

---

# Brain Inputs

The Brain can only make decisions using verified information.

Sources.

Mission

↓

Property

↓

Memory

↓

Documents

↓

Events

↓

Timeline

↓

Professionals

↓

Rules

↓

Previous Decisions

↓

AI Observations

The Brain never guesses when data is missing.

---

# Brain Outputs

Every execution produces one or more outputs.

Possible outputs.

Update Mission

↓

Update Health

↓

Create Task

↓

Generate Opportunity

↓

Generate Warning

↓

Assign Professional

↓

Generate Document

↓

Ask User

↓

Close Mission

↓

Open New Mission

No execution ends without an output.

---

# Brain Priority Order

The Brain always evaluates priorities in this exact order.

1

Critical Risks

↓

2

Mission Blocking Issues

↓

3

Deadlines

↓

4

Dependencies

↓

5

User Requests

↓

6

Optimization Opportunities

↓

7

Automation

Nothing may violate this order.

---

# Brain Decision Rules

The Brain always asks itself.

What is blocking this Mission?

↓

What information is missing?

↓

Can I solve this automatically?

↓

Can I reduce user effort?

↓

Is there a better next step?

↓

Can I predict the next need?

↓

Can another Mission be affected?

Only after answering these questions can Pilot respond.

---

# Brain State

Every Mission Brain has one internal state.

OBSERVING

↓

THINKING

↓

PLANNING

↓

EXECUTING

↓

VERIFYING

↓

IDLE

The user never sees these states.

---

# Brain Memory Access

The Brain never asks twice.

Before asking anything it checks.

Mission Memory

↓

User Memory

↓

Property Memory

↓

Document Memory

↓

Previous Conversations

If information exists,

reuse it.

---

# Brain Risk Analysis

The Brain continuously evaluates risks.

Examples.

Missing mandatory documents.

↓

Deadline approaching.

↓

Incomplete property data.

↓

Missing legal information.

↓

Low quality photos.

↓

Advertisement not published.

↓

Negotiation inactive.

Every detected risk receives a severity.

LOW

MEDIUM

HIGH

CRITICAL

---

# Brain Opportunity Analysis

Pilot constantly searches for improvements.

Examples.

Generate announcement.

↓

Improve description.

↓

Suggest photographer.

↓

Recover missing document.

↓

Prepare contract.

↓

Recommend professional.

↓

Schedule appointment.

Opportunities are proactive.

Never reactive.

---

# Brain Prediction Engine

Pilot predicts future needs.

Example.

APE uploaded.

↓

Prediction.

Floorplan likely needed.

--------------------------------

Photos completed.

↓

Prediction.

Announcement creation.

--------------------------------

Offer received.

↓

Prediction.

Prepare preliminary contract.

Predictions reduce future work.

---

# Brain Confidence

Every decision has a confidence score.

0

Unknown

↓

25

Weak

↓

50

Acceptable

↓

75

High

↓

100

Certain

Low confidence increases verification.

High confidence increases automation.

---

# Brain Automation Rules

If confidence is high,

Pilot should automate.

Examples.

Generate announcement.

Generate checklist.

Generate summary.

Create timeline.

Prepare documents.

Assign mission priority.

Automation is preferred whenever possible.

---

# Brain Escalation

If Pilot cannot continue.

The Brain escalates.

Examples.

Professional required.

↓

Legal advice required.

↓

Human verification required.

↓

Missing mandatory document.

Escalation never blocks future progress.

---

# Brain Learning

Every completed Mission improves future Missions.

Pilot stores.

Successful decisions.

↓

Failed decisions.

↓

Frequently missing documents.

↓

Typical user behaviour.

↓

Average completion times.

↓

Best workflows.

The Brain becomes better over time.

---

# Brain Collaboration

The Mission Brain communicates with.

Memory Engine

↓

Document Engine

↓

Professional Engine

↓

Flow Engine

↓

Conversation Engine

↓

Announcement Engine

The Mission Brain coordinates all other Engines.

---

# Brain Success

A Brain execution is successful when.

Mission is more complete.

↓

Health increases.

↓

Risk decreases.

↓

User effort decreases.

↓

Progress increases.

↓

Next Action becomes clearer.

---

# Golden Principle

The Mission Brain never asks:

"What should I answer?"

The Mission Brain always asks:

"What is the smartest action that moves this Mission forward?"

Every response generated by Pilot is simply the visible consequence of that decision.

====================================================================

END OF CHAPTER 3

# =====================================================================
# CHAPTER 4
# NEXT ACTION ENGINE
# =====================================================================

## Overview

The Next Action Engine is responsible for deciding the single most useful action that should happen next.

Pilot never presents multiple priorities.

Pilot always presents one clear direction.

Every Mission must expose exactly one Next Action.

If Pilot cannot determine the Next Action, the Mission is considered incomplete.

---

# Philosophy

Users become overwhelmed by choices.

Pilot removes uncertainty.

Instead of showing ten possible actions,

Pilot chooses one.

The system assumes responsibility for prioritization.

The user only needs to decide whether to execute it.

---

# Golden Rule

One Mission.

One Goal.

One Next Action.

Always.

---

# Definition

The Next Action represents the highest value activity available at the current moment.

The Next Action changes continuously.

Every new Event may replace it.

---

# Next Action Lifecycle

Every Next Action follows the same lifecycle.

GENERATED

↓

VALIDATED

↓

PROPOSED

↓

STARTED

↓

COMPLETED

↓

ARCHIVED

If the context changes,

the current Next Action is discarded

and a new one is calculated.

---

# Decision Algorithm

Pilot evaluates every possible action.

Each action receives a score.

The action with the highest score becomes the Next Action.

---

# Evaluation Formula

Every candidate action receives points based on:

Impact

Urgency

Dependencies

Risk Reduction

Automation Potential

User Effort

Mission Progress

Professional Availability

Timeline

Confidence

The action with the best overall score wins.

---

# Example

Mission

Sell Property

Possible actions

Upload APE

Score 92

--------------------------------

Book Photographer

Score 70

--------------------------------

Create Announcement

Score 42

--------------------------------

Recover Floorplan

Score 81

Result

Next Action

Upload APE

---

# Blocking Actions

Some actions cannot be postponed.

Examples

Mandatory documents.

↓

Legal verification.

↓

Expired certificates.

↓

Identity verification.

↓

Property ownership validation.

Blocking actions always override normal scoring.

---

# Smart Ordering

Pilot never proposes an impossible action.

Wrong

Create Announcement

↓

Upload Photos

Correct

Upload Photos

↓

Create Announcement

Dependencies are always respected.

---

# User Effort Optimization

Pilot prefers actions that reduce future work.

Example.

Instead of asking separately

for address,

property size,

year,

energy class,

Pilot may ask everything together

if this reduces interruptions.

---

# Automatic Actions

If an action can be executed automatically,

Pilot should execute it.

Examples

Generate summary.

Generate announcement.

Organize documents.

Rename uploaded files.

Extract information from PDFs.

Create timeline.

Create checklist.

The user should only intervene when necessary.

---

# Action Categories

Every Next Action belongs to one category.

INFORMATION

DOCUMENT

PROPERTY

PHOTO

LEGAL

PROFESSIONAL

ANNOUNCEMENT

VISIT

NEGOTIATION

PAYMENT

CONTRACT

AUTOMATION

SYSTEM

---

# Action Priority

Priority is dynamic.

CRITICAL

↓

HIGH

↓

NORMAL

↓

LOW

↓

BACKGROUND

Only one HIGH priority action may exist.

---

# Action Confidence

Every suggested action contains a confidence score.

100

Pilot is certain.

75

Very likely.

50

Reasonable.

25

Needs verification.

Low confidence increases explanation.

High confidence increases automation.

---

# Opportunity Actions

Not every action solves a problem.

Some actions create value.

Examples.

Improve property description.

↓

Optimize asking price.

↓

Suggest virtual tour.

↓

Recommend premium photographer.

↓

Improve announcement SEO.

↓

Generate social media post.

Pilot constantly searches for opportunities.

---

# Risk Actions

Some actions exist only to reduce risk.

Examples.

Renew expired APE.

↓

Verify cadastral data.

↓

Check ownership.

↓

Validate identity.

↓

Review contract.

Risk reduction always has high priority.

---

# Professional Actions

When human expertise is required,

Pilot generates professional actions.

Examples.

Assign surveyor.

↓

Book photographer.

↓

Contact notary.

↓

Request engineer.

↓

Request lawyer.

Pilot never performs regulated activities.

Pilot coordinates them.

---

# Multi-Mission Optimization

If several Missions are active,

Pilot evaluates them together.

Example.

Mission A

Needs floorplan.

Mission B

Needs floorplan.

Pilot asks once.

Both Missions progress.

---

# Action Replacement

Every new Event triggers recalculation.

Current Action

↓

New Document Uploaded

↓

Recalculate

↓

New Action

Old actions may disappear.

This is expected.

---

# Completion Verification

An action is complete only if its expected outcome is verified.

Example.

Upload Photos

Completed only if:

Photos received.

Quality acceptable.

Enough rooms covered.

Otherwise the action remains active.

---

# User Experience Rule

The user should never wonder:

"What should I do now?"

Pilot must always answer that question before the user asks.

---

# Success Criteria

The Next Action Engine succeeds when:

The Mission progresses.

The user performs fewer actions.

The system avoids unnecessary questions.

Dependencies are respected.

No higher priority task is ignored.

The user always knows what to do next.

---

# Golden Principle

Pilot does not guide users through menus.

Pilot guides users through decisions.

Every screen inside CasaPilot should make the Next Action immediately obvious.

The best interface is the one that makes the next step impossible to miss.

====================================================================

END OF CHAPTER 4