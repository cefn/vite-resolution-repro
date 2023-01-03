import {
  PlaylistUrl,
  TimelineEvent,
  TIMELINE_EVENT_SCHEMA,
  NONPLAY_EVENT_TYPES,
} from "@starter/load-json";

/** Accumulated state from past TimelineEvents */
interface SourceState {
  ms: number;
  rate: number;
  url: PlaylistUrl | null;
  playing: boolean | null;
}

/** A unit of composited video */
interface Composited {
  sourceUrl: PlaylistUrl;
  sourceMs: number;
  timelineMs: number;
}

/** Freeze frame has no endMs */
interface FrozenSegment extends Composited {
  kind: "frozen";
}

/** Played segment has an endMs */
interface PlayedSegment extends Composited {
  kind: "played";
  lengthMs: number;
}

type Segment = FrozenSegment | PlayedSegment;

/** Validates array of unknown objects as TimelineEvent objects,
 * throwing an error if events have an unexpected structure. */
export function* createTimelineSequence(
  allEvents: unknown[]
): Generator<TimelineEvent, void, void> {
  for (const event of allEvents) {
    try {
      const validatedEvent = TIMELINE_EVENT_SCHEMA.parse(event);
      yield validatedEvent;
    } catch (e) {
      if (NONPLAY_EVENT_TYPES.includes((event as any).type)) {
        // events expected and deliberately ignored
        continue;
      }
      // unexpected event
      throw e;
    }
  }
}

/** Transforms a sequence of TimelineEvents into Segments that can be more
 * easily mapped to FFMpeg commands. */
export function* createSegments(
  remainingEvents: Iterable<TimelineEvent>,
  commentaryLengthMs: number
): Generator<Segment, void, void> {
  const sourceState: SourceState = {
    ms: 0,
    rate: 1,
    url: null,
    playing: false,
  };

  let prevEvent: TimelineEvent | null = null;

  for (const nextEvent of remainingEvents) {
    // attempt to compose new event into segment
    yield* maybeComposeSegment(
      prevEvent,
      nextEvent,
      commentaryLengthMs,
      sourceState
    );

    // record state - metadata for later events

    if (sourceState.playing === true && prevEvent != null) {
      // progress source media
      sourceState.ms += nextEvent.delta - prevEvent.delta;
    }

    const { type } = nextEvent;
    if (type === "videochangesource") {
      // load media starting at 0
      sourceState.url = nextEvent.url;
    } else if (type === "playbackrate") {
      sourceState.rate = nextEvent.playbackRate;
    } else if (type === "seek") {
      sourceState.ms = nextEvent.time * 1000;
    } else if (type === "pause") {
      sourceState.playing = false;
    } else if (type === "play") {
      sourceState.playing = true;
    } else {
      nextEvent satisfies never;
    }
    prevEvent = nextEvent;
  }
  // write trailing segment if necessary (maybe no final event)
  yield* maybeComposeSegment(prevEvent, null, commentaryLengthMs, sourceState);
}

/** Define a segment of video.
 * Steps over events taking place at the same moment,
 * At the beginning there is no lastEvent (and no segment yet)
 * At the end there is no event (but a segment needs creating)
 */
export function* maybeComposeSegment(
  prevEvent: TimelineEvent | null,
  nextEvent: TimelineEvent | null,
  commentaryLengthMs: number,
  sourceState: SourceState
): Generator<Segment, void, void> {
  if (prevEvent == null) {
    // initial event - no time has passed
    return;
  }
  // timestamp if there is an event else end of timeline
  const timelineMs = nextEvent != null ? nextEvent.delta : commentaryLengthMs;
  const lengthMs = timelineMs - prevEvent.delta;
  if (lengthMs < 10) {
    // previous has (effectively) same timestamp, no time has passed, generate no segment
    // required to handle errored delta timestamps with (at least) off-by-one errors
    return;
  }

  // time has passed - create segment for frozen or played content
  // validate state
  if (sourceState.playing === null) {
    throw new Error(
      `Processing segment for nextEvent ${JSON.stringify(
        nextEvent
      )} but playing state unknown`
    );
  }
  if (sourceState.url === null) {
    throw new Error(
      `Processing segment for nextEvent ${JSON.stringify(
        nextEvent
      )} but url is unknown`
    );
  }

  const kind = sourceState.playing ? "played" : "frozen";

  yield {
    kind,
    timelineMs,
    lengthMs,
    sourceUrl: sourceState.url,
    sourceMs: sourceState.ms,
  };
}
