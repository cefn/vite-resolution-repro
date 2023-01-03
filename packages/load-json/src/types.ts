import { z } from "zod";

export type PlaylistUrl = `https://${string}.m3u8`;

export interface DeltaEvent<TypeName extends string> {
  type: TypeName;
  delta: number;
}

const playlistUrlSchema = z.custom<PlaylistUrl>(
  (val) => {
    if (typeof val !== "string") {
      return false;
    }
    return /^https:\/\/.+\.m3u8$/.test(val);
  },
  { message: "Must be a https m3u8 playlist URL" }
);

const SOURCE_EVENT_SCHEMA = z
  .object({
    delta: z.number(),
    type: z.literal("videochangesource"),
    url: playlistUrlSchema,
  })
  .strict();

const PLAY_EVENT_SCHEMA = z
  .object({
    delta: z.number(),
    type: z.literal("play"),
  })
  .strict();

const RATE_EVENT_SCHEMA = z
  .object({
    delta: z.number(),
    type: z.literal("playbackrate"),
    playbackRate: z.number(),
  })
  .strict();

const PAUSE_EVENT_SCHEMA = z
  .object({
    delta: z.number(),
    type: z.literal("pause"),
  })
  .strict();

const SEEK_EVENT_SCHEMA = z
  .object({
    delta: z.number(),
    type: z.literal("seek"),
    time: z.number(),
  })
  .strict();

export const TIMELINE_EVENT_SCHEMA = z.union([
  SOURCE_EVENT_SCHEMA,
  PLAY_EVENT_SCHEMA,
  RATE_EVENT_SCHEMA,
  PAUSE_EVENT_SCHEMA,
  SEEK_EVENT_SCHEMA,
] as const); // satisfies ZodSchema<DeltaEvent<string>>;

export type SourceEvent = z.infer<typeof SOURCE_EVENT_SCHEMA>;
export type PauseEvent = z.infer<typeof PAUSE_EVENT_SCHEMA>;
export type PlayEvent = z.infer<typeof PLAY_EVENT_SCHEMA>;
export type RateEvent = z.infer<typeof RATE_EVENT_SCHEMA>;
export type SeekEvent = z.infer<typeof SEEK_EVENT_SCHEMA>;

export type TimelineEvent = z.infer<typeof TIMELINE_EVENT_SCHEMA>;

// export const PLAY_EVENT_TYPES = [
//   "videochangesource",
//   "pause",
//   "play",
//   "playbackrate",
//   "seek",
// ] as const satisfies ReadonlyArray<TimelineEvent["type"]>;

export const NONPLAY_EVENT_TYPES = ["sync", "cursormove"] as const;
