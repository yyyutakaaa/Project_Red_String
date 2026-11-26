// A cutscene is a short comic strip that plays before a case's briefing: one or more pages, each
// with a few panels side by side that fade in one after another. Each panel is built from layers
// (background, characters, foreground) that move a little against each other, with caption boxes
// and speech balloons on top that appear one click at a time.
import type { LanguageCode } from '../i18n/languages.ts';

/** A line of text in every language the game ships in. English is required; others fall back to it. */
export type Text = { en: string } & Partial<Record<LanguageCode, string>>;

export interface Layer {
  /**
   * Art key. The drawing is looked up in the cutscene's art set; a file at
   * src/assets/art/cutscenes/<cutscene id>/<key>.(webp|png|jpg|svg) replaces it.
   */
  art: string;
  /** 0 is far away (hardly moves), 1 is right in front of the camera (moves the most). */
  depth: number;
  /** How the layer arrives when the panel opens. */
  enter?: 'left' | 'right' | 'up' | 'down' | 'zoom' | 'fade';
  /** Seconds after the panel opens before the layer arrives. */
  delay?: number;
}

export interface Beat {
  kind: 'caption' | 'balloon';
  text: Text;
  /** Where the box sits, in percent of its panel: its left/top corner and its width. */
  x: number;
  y: number;
  w: number;
  /** For a balloon: the point (in percent of the panel) the tail points at. */
  tail?: { x: number; y: number };
}

/** Which part of a drawing stays in view when the panel is narrower or wider than 16:9. */
export type Focus = 'xMinYMin' | 'xMidYMin' | 'xMaxYMin' | 'xMinYMid' | 'xMidYMid' | 'xMaxYMid' | 'xMinYMax' | 'xMidYMax' | 'xMaxYMax';

export interface Panel {
  /** Also the panel's name in its page's grid. */
  id: string;
  focus?: Focus;
  layers: Layer[];
  beats: Beat[];
  /** A title card: the case's name in big lettering over this panel. */
  titleCard?: boolean;
  /** The camera's slow drift over the panel while it is on screen. */
  drift?: 'in' | 'out' | 'left' | 'right';
}

export interface Page {
  id: string;
  /** CSS grid of the page: column and row sizes, and one string per row naming the panels in it. */
  columns: string;
  rows: string;
  areas: string[];
  /** In the order they fade in. */
  panels: Panel[];
}

export interface Cutscene {
  /** The case id it plays before. */
  id: string;
  pages: Page[];
}
