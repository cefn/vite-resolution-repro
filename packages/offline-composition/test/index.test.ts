import fs from "fs";
import path from "path";
import { TimelineEvent } from "@starter/load-json";
import { createSegments, createTimelineSequence } from "../src/index";

function loadFixtureEvents(): unknown[] {
  const parsed = JSON.parse(
    fs
      .readFileSync(path.resolve(__dirname, "./fixture/example.json"))
      .toString()
  );
  if (!Array.isArray(parsed)) {
    throw new Error("Loaded JSON is not an array");
  }
  return parsed;
}

describe("Compositing with Segments", () => {
  describe("Segment generation", () => {
    it("Can generate two segments", () => {
      const exampleEvents: TimelineEvent[] = [
        { time: 10.0, type: "seek", delta: 0 },
        { playbackRate: 1, type: "playbackrate", delta: 0 },
        {
          url: "https://domain/playlist.m3u8",
          type: "videochangesource",
          delta: 1,
        },
        { type: "pause", delta: 1 },
        { type: "play", delta: 30000 },
      ];
      const commentaryMs = 60000;

      const segments = [...createSegments(exampleEvents, commentaryMs)];

      expect(segments).toMatchObject([
        {
          kind: "frozen",
          lengthMs: 29999,
          sourceMs: 10000,
          sourceUrl: "https://domain/playlist.m3u8",
          timelineMs: 30000,
        },
        {
          kind: "played",
          lengthMs: 30000,
          sourceMs: 10000,
          sourceUrl: "https://domain/playlist.m3u8",
          timelineMs: 60000,
        },
      ]);
    });

    it("Can generate fixture segments", () => {
      const jsonArray = loadFixtureEvents();
      const fixtureEvents = createTimelineSequence(jsonArray);

      const segments = [...createSegments(fixtureEvents, 216000)];

      expect(segments).toMatchObject([
        {
          kind: "frozen",
          lengthMs: 34359,
          sourceMs: 20495.837000000003,
          sourceUrl: "something",
          timelineMs: 34360,
        },
        {
          kind: "played",
          lengthMs: 9198,
          sourceMs: 20495.837000000003,
          sourceUrl: "something",
          timelineMs: 43558,
        },
        {
          kind: "frozen",
          lengthMs: 9321,
          sourceMs: 29693.837000000003,
          sourceUrl: "something",
          timelineMs: 52879,
        },
        {
          kind: "played",
          lengthMs: 5642,
          sourceMs: 29693.837000000003,
          sourceUrl: "something",
          timelineMs: 58521,
        },
        {
          kind: "frozen",
          lengthMs: 9950,
          sourceMs: 35335.837,
          sourceUrl: "something",
          timelineMs: 68471,
        },
        {
          kind: "played",
          lengthMs: 5681,
          sourceMs: 35335.837,
          sourceUrl: "something",
          timelineMs: 74152,
        },
        {
          kind: "frozen",
          lengthMs: 18265,
          sourceMs: 41016.837,
          sourceUrl: "something",
          timelineMs: 92417,
        },
        {
          kind: "frozen",
          lengthMs: 9183,
          sourceMs: 25123.929,
          sourceUrl: "something",
          timelineMs: 101600,
        },
        {
          kind: "played",
          lengthMs: 3785,
          sourceMs: 25123.929,
          sourceUrl: "something",
          timelineMs: 105385,
        },
        {
          kind: "frozen",
          lengthMs: 23082,
          sourceMs: 28908.929,
          sourceUrl: "something",
          timelineMs: 128467,
        },
        {
          kind: "played",
          lengthMs: 7121,
          sourceMs: 28908.929,
          sourceUrl: "something",
          timelineMs: 135588,
        },
        {
          kind: "frozen",
          lengthMs: 11360,
          sourceMs: 36029.929000000004,
          sourceUrl: "something",
          timelineMs: 146948,
        },
        {
          kind: "played",
          lengthMs: 7967,
          sourceMs: 36029.929000000004,
          sourceUrl: "something",
          timelineMs: 154915,
        },
        {
          kind: "frozen",
          lengthMs: 12068,
          sourceMs: 43996.929000000004,
          sourceUrl: "something",
          timelineMs: 166983,
        },
        {
          kind: "played",
          lengthMs: 4184,
          sourceMs: 43996.929000000004,
          sourceUrl: "something",
          timelineMs: 171167,
        },
        {
          kind: "frozen",
          lengthMs: 5834,
          sourceMs: 48180.929000000004,
          sourceUrl: "something",
          timelineMs: 177001,
        },
        {
          kind: "played",
          lengthMs: 3379,
          sourceMs: 48180.929000000004,
          sourceUrl: "something",
          timelineMs: 180380,
        },
        {
          kind: "frozen",
          lengthMs: 2618,
          sourceMs: 51559.929000000004,
          sourceUrl: "something",
          timelineMs: 182998,
        },
        {
          kind: "played",
          lengthMs: 3087,
          sourceMs: 51559.929000000004,
          sourceUrl: "something",
          timelineMs: 186085,
        },
        {
          kind: "frozen",
          lengthMs: 29915,
          sourceMs: 54646.929000000004,
          sourceUrl: "something",
          timelineMs: 216000,
        },
      ]);
    });
  });
});
