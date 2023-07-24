require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 480:
/***/ ((module) => {

"use strict";
/*
    FIGlet.js (a FIGDriver for FIGlet fonts)
    Written by https://github.com/patorjk/figlet.js/graphs/contributors
    Originally Written For: http://patorjk.com/software/taag/
    License: MIT (with this header staying intact)

    This JavaScript code aims to fully implement the FIGlet spec.
    Full FIGlet spec: http://patorjk.com/software/taag/docs/figfont.txt

    FIGlet fonts are actually kind of complex, which is why you will see
    a lot of code about parsing and interpreting rules. The actual generation
    code is pretty simple and is done near the bottom of the code.
*/



const figlet = (() => {
  // ---------------------------------------------------------------------
  // Private static variables

  const FULL_WIDTH = 0,
    FITTING = 1,
    SMUSHING = 2,
    CONTROLLED_SMUSHING = 3;

  // ---------------------------------------------------------------------
  // Variable that will hold information about the fonts

  const figFonts = {}; // What stores all of the FIGlet font data
  const figDefaults = {
    font: "Standard",
    fontPath: "./fonts",
  };

  // ---------------------------------------------------------------------
  // Private static methods

  /*
        This method takes in the oldLayout and newLayout data from the FIGfont header file and returns
        the layout information.
    */
  function getSmushingRules(oldLayout, newLayout) {
    let rules = {};
    let val, index, len, code;
    let codes = [
      [16384, "vLayout", SMUSHING],
      [8192, "vLayout", FITTING],
      [4096, "vRule5", true],
      [2048, "vRule4", true],
      [1024, "vRule3", true],
      [512, "vRule2", true],
      [256, "vRule1", true],
      [128, "hLayout", SMUSHING],
      [64, "hLayout", FITTING],
      [32, "hRule6", true],
      [16, "hRule5", true],
      [8, "hRule4", true],
      [4, "hRule3", true],
      [2, "hRule2", true],
      [1, "hRule1", true],
    ];

    val = newLayout !== null ? newLayout : oldLayout;
    index = 0;
    len = codes.length;
    while (index < len) {
      code = codes[index];
      if (val >= code[0]) {
        val = val - code[0];
        rules[code[1]] =
          typeof rules[code[1]] === "undefined" ? code[2] : rules[code[1]];
      } else if (code[1] !== "vLayout" && code[1] !== "hLayout") {
        rules[code[1]] = false;
      }
      index++;
    }

    if (typeof rules["hLayout"] === "undefined") {
      if (oldLayout === 0) {
        rules["hLayout"] = FITTING;
      } else if (oldLayout === -1) {
        rules["hLayout"] = FULL_WIDTH;
      } else {
        if (
          rules["hRule1"] ||
          rules["hRule2"] ||
          rules["hRule3"] ||
          rules["hRule4"] ||
          rules["hRule5"] ||
          rules["hRule6"]
        ) {
          rules["hLayout"] = CONTROLLED_SMUSHING;
        } else {
          rules["hLayout"] = SMUSHING;
        }
      }
    } else if (rules["hLayout"] === SMUSHING) {
      if (
        rules["hRule1"] ||
        rules["hRule2"] ||
        rules["hRule3"] ||
        rules["hRule4"] ||
        rules["hRule5"] ||
        rules["hRule6"]
      ) {
        rules["hLayout"] = CONTROLLED_SMUSHING;
      }
    }

    if (typeof rules["vLayout"] === "undefined") {
      if (
        rules["vRule1"] ||
        rules["vRule2"] ||
        rules["vRule3"] ||
        rules["vRule4"] ||
        rules["vRule5"]
      ) {
        rules["vLayout"] = CONTROLLED_SMUSHING;
      } else {
        rules["vLayout"] = FULL_WIDTH;
      }
    } else if (rules["vLayout"] === SMUSHING) {
      if (
        rules["vRule1"] ||
        rules["vRule2"] ||
        rules["vRule3"] ||
        rules["vRule4"] ||
        rules["vRule5"]
      ) {
        rules["vLayout"] = CONTROLLED_SMUSHING;
      }
    }

    return rules;
  }

  /* The [vh]Rule[1-6]_Smush functions return the smushed character OR false if the two characters can't be smushed */

  /*
        Rule 1: EQUAL CHARACTER SMUSHING (code value 1)

            Two sub-characters are smushed into a single sub-character
            if they are the same.  This rule does not smush
            hardblanks.  (See rule 6 on hardblanks below)
    */
  function hRule1_Smush(ch1, ch2, hardBlank) {
    if (ch1 === ch2 && ch1 !== hardBlank) {
      return ch1;
    }
    return false;
  }

  /*
        Rule 2: UNDERSCORE SMUSHING (code value 2)

            An underscore ("_") will be replaced by any of: "|", "/",
            "\", "[", "]", "{", "}", "(", ")", "<" or ">".
    */
  function hRule2_Smush(ch1, ch2) {
    let rule2Str = "|/\\[]{}()<>";
    if (ch1 === "_") {
      if (rule2Str.indexOf(ch2) !== -1) {
        return ch2;
      }
    } else if (ch2 === "_") {
      if (rule2Str.indexOf(ch1) !== -1) {
        return ch1;
      }
    }
    return false;
  }

  /*
        Rule 3: HIERARCHY SMUSHING (code value 4)

            A hierarchy of six classes is used: "|", "/\", "[]", "{}",
            "()", and "<>".  When two smushing sub-characters are
            from different classes, the one from the latter class
            will be used.
    */
  function hRule3_Smush(ch1, ch2) {
    let rule3Classes = "| /\\ [] {} () <>";
    let r3_pos1 = rule3Classes.indexOf(ch1);
    let r3_pos2 = rule3Classes.indexOf(ch2);
    if (r3_pos1 !== -1 && r3_pos2 !== -1) {
      if (r3_pos1 !== r3_pos2 && Math.abs(r3_pos1 - r3_pos2) !== 1) {
        const startPos = Math.max(r3_pos1, r3_pos2);
        const endPos = startPos + 1;
        return rule3Classes.substring(startPos, endPos);
      }
    }
    return false;
  }

  /*
        Rule 4: OPPOSITE PAIR SMUSHING (code value 8)

            Smushes opposing brackets ("[]" or "]["), braces ("{}" or
            "}{") and parentheses ("()" or ")(") together, replacing
            any such pair with a vertical bar ("|").
    */
  function hRule4_Smush(ch1, ch2) {
    let rule4Str = "[] {} ()";
    let r4_pos1 = rule4Str.indexOf(ch1);
    let r4_pos2 = rule4Str.indexOf(ch2);
    if (r4_pos1 !== -1 && r4_pos2 !== -1) {
      if (Math.abs(r4_pos1 - r4_pos2) <= 1) {
        return "|";
      }
    }
    return false;
  }

  /*
        Rule 5: BIG X SMUSHING (code value 16)

            Smushes "/\" into "|", "\/" into "Y", and "><" into "X".
            Note that "<>" is not smushed in any way by this rule.
            The name "BIG X" is historical; originally all three pairs
            were smushed into "X".
    */
  function hRule5_Smush(ch1, ch2) {
    let rule5Str = "/\\ \\/ ><";
    let rule5Hash = { 0: "|", 3: "Y", 6: "X" };
    let r5_pos1 = rule5Str.indexOf(ch1);
    let r5_pos2 = rule5Str.indexOf(ch2);
    if (r5_pos1 !== -1 && r5_pos2 !== -1) {
      if (r5_pos2 - r5_pos1 === 1) {
        return rule5Hash[r5_pos1];
      }
    }
    return false;
  }

  /*
        Rule 6: HARDBLANK SMUSHING (code value 32)

            Smushes two hardblanks together, replacing them with a
            single hardblank.  (See "Hardblanks" below.)
    */
  function hRule6_Smush(ch1, ch2, hardBlank) {
    if (ch1 === hardBlank && ch2 === hardBlank) {
      return hardBlank;
    }
    return false;
  }

  /*
        Rule 1: EQUAL CHARACTER SMUSHING (code value 256)

            Same as horizontal smushing rule 1.
    */
  function vRule1_Smush(ch1, ch2) {
    if (ch1 === ch2) {
      return ch1;
    }
    return false;
  }

  /*
        Rule 2: UNDERSCORE SMUSHING (code value 512)

            Same as horizontal smushing rule 2.
    */
  function vRule2_Smush(ch1, ch2) {
    let rule2Str = "|/\\[]{}()<>";
    if (ch1 === "_") {
      if (rule2Str.indexOf(ch2) !== -1) {
        return ch2;
      }
    } else if (ch2 === "_") {
      if (rule2Str.indexOf(ch1) !== -1) {
        return ch1;
      }
    }
    return false;
  }

  /*
        Rule 3: HIERARCHY SMUSHING (code value 1024)

            Same as horizontal smushing rule 3.
    */
  function vRule3_Smush(ch1, ch2) {
    let rule3Classes = "| /\\ [] {} () <>";
    let r3_pos1 = rule3Classes.indexOf(ch1);
    let r3_pos2 = rule3Classes.indexOf(ch2);
    if (r3_pos1 !== -1 && r3_pos2 !== -1) {
      if (r3_pos1 !== r3_pos2 && Math.abs(r3_pos1 - r3_pos2) !== 1) {
        const startPos = Math.max(r3_pos1, r3_pos2);
        const endPos = startPos + 1;
        return rule3Classes.substring(startPos, endPos);
      }
    }
    return false;
  }

  /*
        Rule 4: HORIZONTAL LINE SMUSHING (code value 2048)

            Smushes stacked pairs of "-" and "_", replacing them with
            a single "=" sub-character.  It does not matter which is
            found above the other.  Note that vertical smushing rule 1
            will smush IDENTICAL pairs of horizontal lines, while this
            rule smushes horizontal lines consisting of DIFFERENT
            sub-characters.
    */
  function vRule4_Smush(ch1, ch2) {
    if ((ch1 === "-" && ch2 === "_") || (ch1 === "_" && ch2 === "-")) {
      return "=";
    }
    return false;
  }

  /*
        Rule 5: VERTICAL LINE SUPERSMUSHING (code value 4096)

            This one rule is different from all others, in that it
            "supersmushes" vertical lines consisting of several
            vertical bars ("|").  This creates the illusion that
            FIGcharacters have slid vertically against each other.
            Supersmushing continues until any sub-characters other
            than "|" would have to be smushed.  Supersmushing can
            produce impressive results, but it is seldom possible,
            since other sub-characters would usually have to be
            considered for smushing as soon as any such stacked
            vertical lines are encountered.
    */
  function vRule5_Smush(ch1, ch2) {
    if (ch1 === "|" && ch2 === "|") {
      return "|";
    }
    return false;
  }

  /*
        Universal smushing simply overrides the sub-character from the
        earlier FIGcharacter with the sub-character from the later
        FIGcharacter.  This produces an "overlapping" effect with some
        FIGfonts, wherin the latter FIGcharacter may appear to be "in
        front".
    */
  function uni_Smush(ch1, ch2, hardBlank) {
    if (ch2 === " " || ch2 === "") {
      return ch1;
    } else if (ch2 === hardBlank && ch1 !== " ") {
      return ch1;
    } else {
      return ch2;
    }
  }

  // --------------------------------------------------------------------------
  // main vertical smush routines (excluding rules)

  /*
        txt1 - A line of text
        txt2 - A line of text
        opts - FIGlet options array

        About: Takes in two lines of text and returns one of the following:
        "valid" - These lines can be smushed together given the current smushing rules
        "end" - The lines can be smushed, but we're at a stopping point
        "invalid" - The two lines cannot be smushed together
    */
  function canVerticalSmush(txt1, txt2, opts) {
    if (opts.fittingRules.vLayout === FULL_WIDTH) {
      return "invalid";
    }
    let ii,
      len = Math.min(txt1.length, txt2.length),
      ch1,
      ch2,
      endSmush = false,
      validSmush;
    if (len === 0) {
      return "invalid";
    }

    for (ii = 0; ii < len; ii++) {
      ch1 = txt1.substring(ii, ii + 1);
      ch2 = txt2.substring(ii, ii + 1);
      if (ch1 !== " " && ch2 !== " ") {
        if (opts.fittingRules.vLayout === FITTING) {
          return "invalid";
        } else if (opts.fittingRules.vLayout === SMUSHING) {
          return "end";
        } else {
          if (vRule5_Smush(ch1, ch2)) {
            endSmush = endSmush || false;
            continue;
          } // rule 5 allow for "super" smushing, but only if we're not already ending this smush
          validSmush = false;
          validSmush = opts.fittingRules.vRule1
            ? vRule1_Smush(ch1, ch2)
            : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule2
              ? vRule2_Smush(ch1, ch2)
              : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule3
              ? vRule3_Smush(ch1, ch2)
              : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule4
              ? vRule4_Smush(ch1, ch2)
              : validSmush;
          endSmush = true;
          if (!validSmush) {
            return "invalid";
          }
        }
      }
    }
    if (endSmush) {
      return "end";
    } else {
      return "valid";
    }
  }

  function getVerticalSmushDist(lines1, lines2, opts) {
    let maxDist = lines1.length;
    let len1 = lines1.length;
    let len2 = lines2.length;
    let subLines1, subLines2, slen;
    let curDist = 1;
    let ii, ret, result;
    while (curDist <= maxDist) {
      subLines1 = lines1.slice(Math.max(0, len1 - curDist), len1);
      subLines2 = lines2.slice(0, Math.min(maxDist, curDist));

      slen = subLines2.length; //TODO:check this
      result = "";
      for (ii = 0; ii < slen; ii++) {
        ret = canVerticalSmush(subLines1[ii], subLines2[ii], opts);
        if (ret === "end") {
          result = ret;
        } else if (ret === "invalid") {
          result = ret;
          break;
        } else {
          if (result === "") {
            result = "valid";
          }
        }
      }

      if (result === "invalid") {
        curDist--;
        break;
      }
      if (result === "end") {
        break;
      }
      if (result === "valid") {
        curDist++;
      }
    }

    return Math.min(maxDist, curDist);
  }

  function verticallySmushLines(line1, line2, opts) {
    let ii,
      len = Math.min(line1.length, line2.length);
    let ch1,
      ch2,
      result = "",
      validSmush;

    for (ii = 0; ii < len; ii++) {
      ch1 = line1.substring(ii, ii + 1);
      ch2 = line2.substring(ii, ii + 1);
      if (ch1 !== " " && ch2 !== " ") {
        if (opts.fittingRules.vLayout === FITTING) {
          result += uni_Smush(ch1, ch2);
        } else if (opts.fittingRules.vLayout === SMUSHING) {
          result += uni_Smush(ch1, ch2);
        } else {
          validSmush = false;
          validSmush = opts.fittingRules.vRule5
            ? vRule5_Smush(ch1, ch2)
            : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule1
              ? vRule1_Smush(ch1, ch2)
              : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule2
              ? vRule2_Smush(ch1, ch2)
              : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule3
              ? vRule3_Smush(ch1, ch2)
              : validSmush;
          validSmush =
            !validSmush && opts.fittingRules.vRule4
              ? vRule4_Smush(ch1, ch2)
              : validSmush;
          result += validSmush;
        }
      } else {
        result += uni_Smush(ch1, ch2);
      }
    }
    return result;
  }

  function verticalSmush(lines1, lines2, overlap, opts) {
    let len1 = lines1.length;
    let len2 = lines2.length;
    let piece1 = lines1.slice(0, Math.max(0, len1 - overlap));
    let piece2_1 = lines1.slice(Math.max(0, len1 - overlap), len1);
    let piece2_2 = lines2.slice(0, Math.min(overlap, len2));
    let ii,
      len,
      line,
      piece2 = [],
      piece3,
      result = [];

    len = piece2_1.length;
    for (ii = 0; ii < len; ii++) {
      if (ii >= len2) {
        line = piece2_1[ii];
      } else {
        line = verticallySmushLines(piece2_1[ii], piece2_2[ii], opts);
      }
      piece2.push(line);
    }

    piece3 = lines2.slice(Math.min(overlap, len2), len2);

    return result.concat(piece1, piece2, piece3);
  }

  function padLines(lines, numSpaces) {
    let ii,
      len = lines.length,
      padding = "";
    for (ii = 0; ii < numSpaces; ii++) {
      padding += " ";
    }
    for (ii = 0; ii < len; ii++) {
      lines[ii] += padding;
    }
  }

  function smushVerticalFigLines(output, lines, opts) {
    let len1 = output[0].length;
    let len2 = lines[0].length;
    let overlap;
    if (len1 > len2) {
      padLines(lines, len1 - len2);
    } else if (len2 > len1) {
      padLines(output, len2 - len1);
    }
    overlap = getVerticalSmushDist(output, lines, opts);
    return verticalSmush(output, lines, overlap, opts);
  }

  // -------------------------------------------------------------------------
  // Main horizontal smush routines (excluding rules)

  function getHorizontalSmushLength(txt1, txt2, opts) {
    if (opts.fittingRules.hLayout === FULL_WIDTH) {
      return 0;
    }
    let ii,
      len1 = txt1.length,
      len2 = txt2.length;
    let maxDist = len1;
    let curDist = 1;
    let breakAfter = false;
    let validSmush = false;
    let seg1, seg2, ch1, ch2;
    if (len1 === 0) {
      return 0;
    }

    distCal: while (curDist <= maxDist) {
      const seg1StartPos = len1 - curDist;
      seg1 = txt1.substring(seg1StartPos, seg1StartPos + curDist);
      seg2 = txt2.substring(0, Math.min(curDist, len2));
      for (ii = 0; ii < Math.min(curDist, len2); ii++) {
        ch1 = seg1.substring(ii, ii + 1);
        ch2 = seg2.substring(ii, ii + 1);
        if (ch1 !== " " && ch2 !== " ") {
          if (opts.fittingRules.hLayout === FITTING) {
            curDist = curDist - 1;
            break distCal;
          } else if (opts.fittingRules.hLayout === SMUSHING) {
            if (ch1 === opts.hardBlank || ch2 === opts.hardBlank) {
              curDist = curDist - 1; // universal smushing does not smush hardblanks
            }
            break distCal;
          } else {
            breakAfter = true; // we know we need to break, but we need to check if our smushing rules will allow us to smush the overlapped characters
            validSmush = false; // the below checks will let us know if we can smush these characters

            validSmush = opts.fittingRules.hRule1
              ? hRule1_Smush(ch1, ch2, opts.hardBlank)
              : validSmush;
            validSmush =
              !validSmush && opts.fittingRules.hRule2
                ? hRule2_Smush(ch1, ch2, opts.hardBlank)
                : validSmush;
            validSmush =
              !validSmush && opts.fittingRules.hRule3
                ? hRule3_Smush(ch1, ch2, opts.hardBlank)
                : validSmush;
            validSmush =
              !validSmush && opts.fittingRules.hRule4
                ? hRule4_Smush(ch1, ch2, opts.hardBlank)
                : validSmush;
            validSmush =
              !validSmush && opts.fittingRules.hRule5
                ? hRule5_Smush(ch1, ch2, opts.hardBlank)
                : validSmush;
            validSmush =
              !validSmush && opts.fittingRules.hRule6
                ? hRule6_Smush(ch1, ch2, opts.hardBlank)
                : validSmush;

            if (!validSmush) {
              curDist = curDist - 1;
              break distCal;
            }
          }
        }
      }
      if (breakAfter) {
        break;
      }
      curDist++;
    }
    return Math.min(maxDist, curDist);
  }

  function horizontalSmush(textBlock1, textBlock2, overlap, opts) {
    let ii,
      jj,
      outputFig = [],
      overlapStart,
      piece1,
      piece2,
      piece3,
      len1,
      len2,
      txt1,
      txt2;

    for (ii = 0; ii < opts.height; ii++) {
      txt1 = textBlock1[ii];
      txt2 = textBlock2[ii];
      len1 = txt1.length;
      len2 = txt2.length;
      overlapStart = len1 - overlap;
      piece1 = txt1.substr(0, Math.max(0, overlapStart));
      piece2 = "";

      // determine overlap piece
      const seg1StartPos = Math.max(0, len1 - overlap);
      var seg1 = txt1.substring(seg1StartPos, seg1StartPos + overlap);
      var seg2 = txt2.substring(0, Math.min(overlap, len2));

      for (jj = 0; jj < overlap; jj++) {
        var ch1 = jj < len1 ? seg1.substring(jj, jj + 1) : " ";
        var ch2 = jj < len2 ? seg2.substring(jj, jj + 1) : " ";

        if (ch1 !== " " && ch2 !== " ") {
          if (opts.fittingRules.hLayout === FITTING) {
            piece2 += uni_Smush(ch1, ch2, opts.hardBlank);
          } else if (opts.fittingRules.hLayout === SMUSHING) {
            piece2 += uni_Smush(ch1, ch2, opts.hardBlank);
          } else {
            // Controlled Smushing
            var nextCh = "";
            nextCh =
              !nextCh && opts.fittingRules.hRule1
                ? hRule1_Smush(ch1, ch2, opts.hardBlank)
                : nextCh;
            nextCh =
              !nextCh && opts.fittingRules.hRule2
                ? hRule2_Smush(ch1, ch2, opts.hardBlank)
                : nextCh;
            nextCh =
              !nextCh && opts.fittingRules.hRule3
                ? hRule3_Smush(ch1, ch2, opts.hardBlank)
                : nextCh;
            nextCh =
              !nextCh && opts.fittingRules.hRule4
                ? hRule4_Smush(ch1, ch2, opts.hardBlank)
                : nextCh;
            nextCh =
              !nextCh && opts.fittingRules.hRule5
                ? hRule5_Smush(ch1, ch2, opts.hardBlank)
                : nextCh;
            nextCh =
              !nextCh && opts.fittingRules.hRule6
                ? hRule6_Smush(ch1, ch2, opts.hardBlank)
                : nextCh;
            nextCh = nextCh || uni_Smush(ch1, ch2, opts.hardBlank);
            piece2 += nextCh;
          }
        } else {
          piece2 += uni_Smush(ch1, ch2, opts.hardBlank);
        }
      }

      if (overlap >= len2) {
        piece3 = "";
      } else {
        piece3 = txt2.substring(overlap, overlap + Math.max(0, len2 - overlap));
      }
      outputFig[ii] = piece1 + piece2 + piece3;
    }
    return outputFig;
  }

  /*
        Creates new empty ASCII placeholder of give len
        - len - number
    */
  function newFigChar(len) {
    let outputFigText = [],
      row;
    for (row = 0; row < len; row++) {
      outputFigText[row] = "";
    }
    return outputFigText;
  }

  /*
        Return max line of the ASCII Art
        - text is array of lines for text
        - char is next character
     */
  const figLinesWidth = function (textLines) {
    return Math.max.apply(
      Math,
      textLines.map(function (line, i) {
        return line.length;
      })
    );
  };

  /*
       join words or single characaters into single Fig line
       - array - array of ASCII words or single characters: {fig: array, overlap: number}
       - len - height of the Characters (number of rows)
       - opt - options object
    */
  function joinFigArray(array, len, opts) {
    return array.reduce(function (acc, data) {
      return horizontalSmush(acc, data.fig, data.overlap, opts);
    }, newFigChar(len));
  }

  /*
       break long word return leftover characters and line before the break
       - figChars - list of single ASCII characters in form {fig, overlap}
       - len - number of rows
       - opt - options object
    */
  function breakWord(figChars, len, opts) {
    const result = {};
    for (let i = figChars.length; --i; ) {
      let w = joinFigArray(figChars.slice(0, i), len, opts);
      if (figLinesWidth(w) <= opts.width) {
        result.outputFigText = w;
        if (i < figChars.length) {
          result.chars = figChars.slice(i);
        } else {
          result.chars = [];
        }
        break;
      }
    }
    return result;
  }

  function generateFigTextLines(txt, figChars, opts) {
    let charIndex,
      figChar,
      overlap = 0,
      row,
      outputFigText,
      len,
      height = opts.height,
      outputFigLines = [],
      maxWidth,
      nextFigChars,
      figWords = [],
      char,
      isSpace,
      textFigWord,
      textFigLine,
      tmpBreak;

    outputFigText = newFigChar(height);
    if (opts.width > 0 && opts.whitespaceBreak) {
      // list of characters is used to break in the middle of the word when word is logner
      // chars is array of characters with {fig, overlap} and overlap is for whole word
      nextFigChars = {
        chars: [],
        overlap: overlap,
      };
    }
    if (opts.printDirection === 1) {
      txt = txt.split("").reverse().join("");
    }
    len = txt.length;
    for (charIndex = 0; charIndex < len; charIndex++) {
      char = txt.substring(charIndex, charIndex + 1);
      isSpace = char.match(/\s/);
      figChar = figChars[char.charCodeAt(0)];
      textFigLine = null;
      if (figChar) {
        if (opts.fittingRules.hLayout !== FULL_WIDTH) {
          overlap = 10000; // a value too high to be the overlap
          for (row = 0; row < opts.height; row++) {
            overlap = Math.min(
              overlap,
              getHorizontalSmushLength(outputFigText[row], figChar[row], opts)
            );
          }
          overlap = overlap === 10000 ? 0 : overlap;
        }
        if (opts.width > 0) {
          if (opts.whitespaceBreak) {
            // next character in last word (figChars have same data as words)
            textFigWord = joinFigArray(
              nextFigChars.chars.concat([
                {
                  fig: figChar,
                  overlap: overlap,
                },
              ]),
              height,
              opts
            );
            textFigLine = joinFigArray(
              figWords.concat([
                {
                  fig: textFigWord,
                  overlap: nextFigChars.overlap,
                },
              ]),
              height,
              opts
            );
            maxWidth = figLinesWidth(textFigLine);
          } else {
            textFigLine = horizontalSmush(
              outputFigText,
              figChar,
              overlap,
              opts
            );
            maxWidth = figLinesWidth(textFigLine);
          }
          if (maxWidth >= opts.width && charIndex > 0) {
            if (opts.whitespaceBreak) {
              outputFigText = joinFigArray(figWords.slice(0, -1), height, opts);
              if (figWords.length > 1) {
                outputFigLines.push(outputFigText);
                outputFigText = newFigChar(height);
              }
              figWords = [];
            } else {
              outputFigLines.push(outputFigText);
              outputFigText = newFigChar(height);
            }
          }
        }
        if (opts.width > 0 && opts.whitespaceBreak) {
          if (!isSpace || charIndex === len - 1) {
            nextFigChars.chars.push({ fig: figChar, overlap: overlap });
          }
          if (isSpace || charIndex === len - 1) {
            // break long words
            tmpBreak = null;
            while (true) {
              textFigLine = joinFigArray(nextFigChars.chars, height, opts);
              maxWidth = figLinesWidth(textFigLine);
              if (maxWidth >= opts.width) {
                tmpBreak = breakWord(nextFigChars.chars, height, opts);
                nextFigChars = { chars: tmpBreak.chars };
                outputFigLines.push(tmpBreak.outputFigText);
              } else {
                break;
              }
            }
            // any leftovers
            if (maxWidth > 0) {
              if (tmpBreak) {
                figWords.push({ fig: textFigLine, overlap: 1 });
              } else {
                figWords.push({
                  fig: textFigLine,
                  overlap: nextFigChars.overlap,
                });
              }
            }
            // save space character and current overlap for smush in joinFigWords
            if (isSpace) {
              figWords.push({ fig: figChar, overlap: overlap });
              outputFigText = newFigChar(height);
            }
            if (charIndex === len - 1) {
              // last line
              outputFigText = joinFigArray(figWords, height, opts);
            }
            nextFigChars = {
              chars: [],
              overlap: overlap,
            };
            continue;
          }
        }
        outputFigText = horizontalSmush(outputFigText, figChar, overlap, opts);
      }
    }
    // special case when last line would be empty
    // this may happen if text fit exactly opt.width
    if (figLinesWidth(outputFigText) > 0) {
      outputFigLines.push(outputFigText);
    }
    // remove hardblanks
    if (opts.showHardBlanks !== true) {
      outputFigLines.forEach(function (outputFigText) {
        len = outputFigText.length;
        for (row = 0; row < len; row++) {
          outputFigText[row] = outputFigText[row].replace(
            new RegExp("\\" + opts.hardBlank, "g"),
            " "
          );
        }
      });
    }
    return outputFigLines;
  }

  // -------------------------------------------------------------------------
  // Parsing and Generation methods

  const getHorizontalFittingRules = function (layout, options) {
    let props = [
        "hLayout",
        "hRule1",
        "hRule2",
        "hRule3",
        "hRule4",
        "hRule5",
        "hRule6",
      ],
      params = {},
      ii;
    if (layout === "default") {
      for (ii = 0; ii < props.length; ii++) {
        params[props[ii]] = options.fittingRules[props[ii]];
      }
    } else if (layout === "full") {
      params = {
        hLayout: FULL_WIDTH,
        hRule1: false,
        hRule2: false,
        hRule3: false,
        hRule4: false,
        hRule5: false,
        hRule6: false,
      };
    } else if (layout === "fitted") {
      params = {
        hLayout: FITTING,
        hRule1: false,
        hRule2: false,
        hRule3: false,
        hRule4: false,
        hRule5: false,
        hRule6: false,
      };
    } else if (layout === "controlled smushing") {
      params = {
        hLayout: CONTROLLED_SMUSHING,
        hRule1: true,
        hRule2: true,
        hRule3: true,
        hRule4: true,
        hRule5: true,
        hRule6: true,
      };
    } else if (layout === "universal smushing") {
      params = {
        hLayout: SMUSHING,
        hRule1: false,
        hRule2: false,
        hRule3: false,
        hRule4: false,
        hRule5: false,
        hRule6: false,
      };
    } else {
      return;
    }
    return params;
  };

  const getVerticalFittingRules = function (layout, options) {
    let props = ["vLayout", "vRule1", "vRule2", "vRule3", "vRule4", "vRule5"],
      params = {},
      ii;
    if (layout === "default") {
      for (ii = 0; ii < props.length; ii++) {
        params[props[ii]] = options.fittingRules[props[ii]];
      }
    } else if (layout === "full") {
      params = {
        vLayout: FULL_WIDTH,
        vRule1: false,
        vRule2: false,
        vRule3: false,
        vRule4: false,
        vRule5: false,
      };
    } else if (layout === "fitted") {
      params = {
        vLayout: FITTING,
        vRule1: false,
        vRule2: false,
        vRule3: false,
        vRule4: false,
        vRule5: false,
      };
    } else if (layout === "controlled smushing") {
      params = {
        vLayout: CONTROLLED_SMUSHING,
        vRule1: true,
        vRule2: true,
        vRule3: true,
        vRule4: true,
        vRule5: true,
      };
    } else if (layout === "universal smushing") {
      params = {
        vLayout: SMUSHING,
        vRule1: false,
        vRule2: false,
        vRule3: false,
        vRule4: false,
        vRule5: false,
      };
    } else {
      return;
    }
    return params;
  };

  /*
        Generates the ASCII Art
        - fontName: Font to use
        - option: Options to override the defaults
        - txt: The text to make into ASCII Art
    */
  const generateText = function (fontName, options, txt) {
    txt = txt.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    let lines = txt.split("\n");
    let figLines = [];
    let ii, len, output;
    len = lines.length;
    for (ii = 0; ii < len; ii++) {
      figLines = figLines.concat(
        generateFigTextLines(lines[ii], figFonts[fontName], options)
      );
    }
    len = figLines.length;
    output = figLines[0];
    for (ii = 1; ii < len; ii++) {
      output = smushVerticalFigLines(output, figLines[ii], options);
    }

    return output ? output.join("\n") : "";
  };

  /*
      takes assigned options and merges them with the default options from the choosen font
     */
  function _reworkFontOpts(fontOpts, options) {
    let myOpts = JSON.parse(JSON.stringify(fontOpts)), // make a copy because we may edit this (see below)
      params,
      prop;

    /*
         If the user is chosing to use a specific type of layout (e.g., 'full', 'fitted', etc etc)
         Then we need to override the default font options.
         */
    if (typeof options.horizontalLayout !== "undefined") {
      params = getHorizontalFittingRules(options.horizontalLayout, fontOpts);
      for (prop in params) {
        if (params.hasOwnProperty(prop)) {
          myOpts.fittingRules[prop] = params[prop];
        }
      }
    }
    if (typeof options.verticalLayout !== "undefined") {
      params = getVerticalFittingRules(options.verticalLayout, fontOpts);
      for (prop in params) {
        if (params.hasOwnProperty(prop)) {
          myOpts.fittingRules[prop] = params[prop];
        }
      }
    }
    myOpts.printDirection =
      typeof options.printDirection !== "undefined"
        ? options.printDirection
        : fontOpts.printDirection;
    myOpts.showHardBlanks = options.showHardBlanks || false;
    myOpts.width = options.width || -1;
    myOpts.whitespaceBreak = options.whitespaceBreak || false;

    return myOpts;
  }

  // -------------------------------------------------------------------------
  // Public methods

  /*
        A short-cut for the figlet.text method

        Parameters:
        - txt (string): The text to make into ASCII Art
        - options (object/string - optional): Options that will override the current font's default options.
          If a string is provided instead of an object, it is assumed to be the font name.

            * font
            * horizontalLayout
            * verticalLayout
            * showHardBlanks - Wont remove hardblank characters

        - next (function): A callback function, it will contained the outputted ASCII Art.
    */
  const me = function (txt, options, next) {
    me.text(txt, options, next);
  };
  me.text = function (txt, options, next) {
    let fontName = "";

    // Validate inputs
    txt = txt + "";

    if (typeof arguments[1] === "function") {
      next = options;
      options = {};
      options.font = figDefaults.font; // default font
    }

    if (typeof options === "string") {
      fontName = options;
      options = {};
    } else {
      options = options || {};
      fontName = options.font || figDefaults.font;
    }

    /*
            Load the font. If it loads, it's data will be contained in the figFonts object.
            The callback will recieve a fontsOpts object, which contains the default
            options of the font (its fitting rules, etc etc).
        */
    me.loadFont(fontName, function (err, fontOpts) {
      if (err) {
        return next(err);
      }

      next(
        null,
        generateText(fontName, _reworkFontOpts(fontOpts, options), txt)
      );
    });
  };

  /*
        Synchronous version of figlet.text.
        Accepts the same parameters.
     */
  me.textSync = function (txt, options) {
    let fontName = "";

    // Validate inputs
    txt = txt + "";

    if (typeof options === "string") {
      fontName = options;
      options = {};
    } else {
      options = options || {};
      fontName = options.font || figDefaults.font;
    }

    var fontOpts = _reworkFontOpts(me.loadFontSync(fontName), options);
    return generateText(fontName, fontOpts, txt);
  };

  /*
        Returns metadata about a specfic FIGlet font.

        Returns:
            next(err, options, headerComment)
            - err: The error if an error occurred, otherwise null/falsey.
            - options (object): The options defined for the font.
            - headerComment (string): The font's header comment.
    */
  me.metadata = function (fontName, next) {
    fontName = fontName + "";

    /*
            Load the font. If it loads, it's data will be contained in the figFonts object.
            The callback will recieve a fontsOpts object, which contains the default
            options of the font (its fitting rules, etc etc).
        */
    me.loadFont(fontName, function (err, fontOpts) {
      if (err) {
        next(err);
        return;
      }

      next(null, fontOpts, figFonts[fontName].comment);
    });
  };

  /*
        Allows you to override defaults. See the definition of the figDefaults object up above
        to see what properties can be overridden.
        Returns the options for the font.
    */
  me.defaults = function (opts) {
    if (typeof opts === "object" && opts !== null) {
      for (var prop in opts) {
        if (opts.hasOwnProperty(prop)) {
          figDefaults[prop] = opts[prop];
        }
      }
    }
    return JSON.parse(JSON.stringify(figDefaults));
  };

  /*
        Parses data from a FIGlet font file and places it into the figFonts object.
    */
  me.parseFont = function (fontName, data) {
    data = data.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    figFonts[fontName] = {};

    var lines = data.split("\n");
    var headerData = lines.splice(0, 1)[0].split(" ");
    var figFont = figFonts[fontName];
    var opts = {};

    opts.hardBlank = headerData[0].substr(5, 1);
    opts.height = parseInt(headerData[1], 10);
    opts.baseline = parseInt(headerData[2], 10);
    opts.maxLength = parseInt(headerData[3], 10);
    opts.oldLayout = parseInt(headerData[4], 10);
    opts.numCommentLines = parseInt(headerData[5], 10);
    opts.printDirection =
      headerData.length >= 6 ? parseInt(headerData[6], 10) : 0;
    opts.fullLayout =
      headerData.length >= 7 ? parseInt(headerData[7], 10) : null;
    opts.codeTagCount =
      headerData.length >= 8 ? parseInt(headerData[8], 10) : null;
    opts.fittingRules = getSmushingRules(opts.oldLayout, opts.fullLayout);

    figFont.options = opts;

    // error check
    if (
      opts.hardBlank.length !== 1 ||
      isNaN(opts.height) ||
      isNaN(opts.baseline) ||
      isNaN(opts.maxLength) ||
      isNaN(opts.oldLayout) ||
      isNaN(opts.numCommentLines)
    ) {
      throw new Error("FIGlet header contains invalid values.");
    }

    /*
            All FIGlet fonts must contain chars 32-126, 196, 214, 220, 228, 246, 252, 223
        */

    let charNums = [],
      ii;
    for (ii = 32; ii <= 126; ii++) {
      charNums.push(ii);
    }
    charNums = charNums.concat(196, 214, 220, 228, 246, 252, 223);

    // error check - validate that there are enough lines in the file
    if (lines.length < opts.numCommentLines + opts.height * charNums.length) {
      throw new Error("FIGlet file is missing data.");
    }

    /*
            Parse out the context of the file and put it into our figFont object
        */

    let cNum,
      endCharRegEx,
      parseError = false;

    figFont.comment = lines.splice(0, opts.numCommentLines).join("\n");
    figFont.numChars = 0;

    while (lines.length > 0 && figFont.numChars < charNums.length) {
      cNum = charNums[figFont.numChars];
      figFont[cNum] = lines.splice(0, opts.height);
      // remove end sub-chars
      for (ii = 0; ii < opts.height; ii++) {
        if (typeof figFont[cNum][ii] === "undefined") {
          figFont[cNum][ii] = "";
        } else {
          endCharRegEx = new RegExp(
            "\\" +
              figFont[cNum][ii].substr(figFont[cNum][ii].length - 1, 1) +
              "+$"
          );
          figFont[cNum][ii] = figFont[cNum][ii].replace(endCharRegEx, "");
        }
      }
      figFont.numChars++;
    }

    /*
            Now we check to see if any additional characters are present
        */

    while (lines.length > 0) {
      cNum = lines.splice(0, 1)[0].split(" ")[0];
      if (/^0[xX][0-9a-fA-F]+$/.test(cNum)) {
        cNum = parseInt(cNum, 16);
      } else if (/^0[0-7]+$/.test(cNum)) {
        cNum = parseInt(cNum, 8);
      } else if (/^[0-9]+$/.test(cNum)) {
        cNum = parseInt(cNum, 10);
      } else if (/^-0[xX][0-9a-fA-F]+$/.test(cNum)) {
        cNum = parseInt(cNum, 16);
      } else {
        if (cNum === "") {
          break;
        }
        // something's wrong
        console.log("Invalid data:" + cNum);
        parseError = true;
        break;
      }

      figFont[cNum] = lines.splice(0, opts.height);
      // remove end sub-chars
      for (ii = 0; ii < opts.height; ii++) {
        if (typeof figFont[cNum][ii] === "undefined") {
          figFont[cNum][ii] = "";
        } else {
          endCharRegEx = new RegExp(
            "\\" +
              figFont[cNum][ii].substr(figFont[cNum][ii].length - 1, 1) +
              "+$"
          );
          figFont[cNum][ii] = figFont[cNum][ii].replace(endCharRegEx, "");
        }
      }
      figFont.numChars++;
    }

    // error check
    if (parseError === true) {
      throw new Error("Error parsing data.");
    }

    return opts;
  };

  /*
        Loads a font.
    */
  me.loadFont = function (fontName, next) {
    if (figFonts[fontName]) {
      next(null, figFonts[fontName].options);
      return;
    }

    if (typeof fetch !== "function") {
      console.error(
        "figlet.js requires the fetch API or a fetch polyfill such as https://cdnjs.com/libraries/fetch"
      );
      throw new Error("fetch is required for figlet.js to work.");
    }

    fetch(figDefaults.fontPath + "/" + fontName + ".flf")
      .then(function (response) {
        if (response.ok) {
          return response.text();
        }

        console.log("Unexpected response", response);
        throw new Error("Network response was not ok.");
      })
      .then(function (text) {
        next(null, me.parseFont(fontName, text));
      })
      .catch(next);
  };

  /*
        loads a font synchronously, not implemented for the browser
     */
  me.loadFontSync = function (name) {
    if (figFonts[name]) {
      return figFonts[name].options;
    }
    throw new Error(
      "synchronous font loading is not implemented for the browser"
    );
  };

  /*
        preloads a list of fonts prior to using textSync
        - fonts: an array of font names (i.e. ["Standard","Soft"])
        - next: callback function
     */
  me.preloadFonts = function (fonts, next) {
    let fontData = [];

    fonts
      .reduce(function (promise, name) {
        return promise.then(function () {
          return fetch(figDefaults.fontPath + "/" + name + ".flf")
            .then((response) => {
              return response.text();
            })
            .then(function (data) {
              fontData.push(data);
            });
        });
      }, Promise.resolve())
      .then(function (res) {
        for (var i in fonts) {
          if (fonts.hasOwnProperty(i)) {
            me.parseFont(fonts[i], fontData[i]);
          }
        }

        if (next) {
          next();
        }
      });
  };

  me.figFonts = figFonts;

  return me;
})();

// for node.js
if (true) {
  if (typeof module.exports !== "undefined") {
    module.exports = figlet;
  }
}


/***/ }),

/***/ 405:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*
	Node plugin for figlet.js
*/

const figlet = __nccwpck_require__(480),
  fs = __nccwpck_require__(147),
  path = __nccwpck_require__(17),
  fontDir = __nccwpck_require__.ab + "fonts";

/*
    Loads a font into the figlet object.

    Parameters:
    - name (string): Name of the font to load.
    - next (function): Callback function.
*/
figlet.loadFont = function (name, next) {
  if (figlet.figFonts[name]) {
    next(null, figlet.figFonts[name].options);
    return;
  }

  fs.readFile(
    __nccwpck_require__.ab + "fonts/" + name + '.flf',
    { encoding: "utf-8" },
    function (err, fontData) {
      if (err) {
        return next(err);
      }

      fontData = fontData + "";
      try {
        next(null, figlet.parseFont(name, fontData));
      } catch (error) {
        next(error);
      }
    }
  );
};

/*
 Loads a font synchronously into the figlet object.

 Parameters:
 - name (string): Name of the font to load.
 */
figlet.loadFontSync = function (name) {
  if (figlet.figFonts[name]) {
    return figlet.figFonts[name].options;
  }

  var fontData = fs.readFileSync(__nccwpck_require__.ab + "fonts/" + name + '.flf', {
    encoding: "utf-8",
  });

  fontData = fontData + "";
  return figlet.parseFont(name, fontData);
};

/*
    Returns an array containing all of the font names
*/
figlet.fonts = function (next) {
  var fontList = [];
  fs.readdir(__nccwpck_require__.ab + "fonts", function (err, files) {
    // '/' denotes the root folder
    if (err) {
      return next(err);
    }

    files.forEach(function (file) {
      if (/\.flf$/.test(file)) {
        fontList.push(file.replace(/\.flf$/, ""));
      }
    });

    next(null, fontList);
  });
};

figlet.fontsSync = function () {
  var fontList = [];
  fs.readdirSync(__nccwpck_require__.ab + "fonts").forEach(function (file) {
    if (/\.flf$/.test(file)) {
      fontList.push(file.replace(/\.flf$/, ""));
    }
  });

  return fontList;
};

module.exports = figlet;


/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 361:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 282:
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ 379:
/***/ ((module, exports, __nccwpck_require__) => {

const { Argument } = __nccwpck_require__(414);
const { Command } = __nccwpck_require__(552);
const { CommanderError, InvalidArgumentError } = __nccwpck_require__(625);
const { Help } = __nccwpck_require__(153);
const { Option } = __nccwpck_require__(558);

// @ts-check

/**
 * Expose the root command.
 */

exports = module.exports = new Command();
exports.program = exports; // More explicit access to global command.
// Implicit export of createArgument, createCommand, and createOption.

/**
 * Expose classes
 */

exports.Argument = Argument;
exports.Command = Command;
exports.CommanderError = CommanderError;
exports.Help = Help;
exports.InvalidArgumentError = InvalidArgumentError;
exports.InvalidOptionArgumentError = InvalidArgumentError; // Deprecated
exports.Option = Option;


/***/ }),

/***/ 414:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const { InvalidArgumentError } = __nccwpck_require__(625);

// @ts-check

class Argument {
  /**
   * Initialize a new command argument with the given name and description.
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @param {string} name
   * @param {string} [description]
   */

  constructor(name, description) {
    this.description = description || '';
    this.variadic = false;
    this.parseArg = undefined;
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.argChoices = undefined;

    switch (name[0]) {
      case '<': // e.g. <required>
        this.required = true;
        this._name = name.slice(1, -1);
        break;
      case '[': // e.g. [optional]
        this.required = false;
        this._name = name.slice(1, -1);
        break;
      default:
        this.required = true;
        this._name = name;
        break;
    }

    if (this._name.length > 3 && this._name.slice(-3) === '...') {
      this.variadic = true;
      this._name = this._name.slice(0, -3);
    }
  }

  /**
   * Return argument name.
   *
   * @return {string}
   */

  name() {
    return this._name;
  }

  /**
   * @api private
   */

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {any} value
   * @param {string} [description]
   * @return {Argument}
   */

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Set the custom handler for processing CLI command arguments into argument values.
   *
   * @param {Function} [fn]
   * @return {Argument}
   */

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Only allow argument value to be one of choices.
   *
   * @param {string[]} values
   * @return {Argument}
   */

  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Make argument required.
   */
  argRequired() {
    this.required = true;
    return this;
  }

  /**
   * Make argument optional.
   */
  argOptional() {
    this.required = false;
    return this;
  }
}

/**
 * Takes an argument and returns its human readable equivalent for help usage.
 *
 * @param {Argument} arg
 * @return {string}
 * @api private
 */

function humanReadableArgName(arg) {
  const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');

  return arg.required
    ? '<' + nameOutput + '>'
    : '[' + nameOutput + ']';
}

exports.Argument = Argument;
exports.humanReadableArgName = humanReadableArgName;


/***/ }),

/***/ 552:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const EventEmitter = (__nccwpck_require__(361).EventEmitter);
const childProcess = __nccwpck_require__(81);
const path = __nccwpck_require__(17);
const fs = __nccwpck_require__(147);
const process = __nccwpck_require__(282);

const { Argument, humanReadableArgName } = __nccwpck_require__(414);
const { CommanderError } = __nccwpck_require__(625);
const { Help } = __nccwpck_require__(153);
const { Option, splitOptionFlags, DualOptions } = __nccwpck_require__(558);
const { suggestSimilar } = __nccwpck_require__(592);

// @ts-check

class Command extends EventEmitter {
  /**
   * Initialize a new `Command`.
   *
   * @param {string} [name]
   */

  constructor(name) {
    super();
    /** @type {Command[]} */
    this.commands = [];
    /** @type {Option[]} */
    this.options = [];
    this.parent = null;
    this._allowUnknownOption = false;
    this._allowExcessArguments = true;
    /** @type {Argument[]} */
    this._args = [];
    /** @type {string[]} */
    this.args = []; // cli args with options removed
    this.rawArgs = [];
    this.processedArgs = []; // like .args but after custom processing and collecting variadic
    this._scriptPath = null;
    this._name = name || '';
    this._optionValues = {};
    this._optionValueSources = {}; // default, env, cli etc
    this._storeOptionsAsProperties = false;
    this._actionHandler = null;
    this._executableHandler = false;
    this._executableFile = null; // custom name for executable
    this._executableDir = null; // custom search directory for subcommands
    this._defaultCommandName = null;
    this._exitCallback = null;
    this._aliases = [];
    this._combineFlagAndOptionalValue = true;
    this._description = '';
    this._summary = '';
    this._argsDescription = undefined; // legacy
    this._enablePositionalOptions = false;
    this._passThroughOptions = false;
    this._lifeCycleHooks = {}; // a hash of arrays
    /** @type {boolean | string} */
    this._showHelpAfterError = false;
    this._showSuggestionAfterError = true;

    // see .configureOutput() for docs
    this._outputConfiguration = {
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => process.stderr.write(str),
      getOutHelpWidth: () => process.stdout.isTTY ? process.stdout.columns : undefined,
      getErrHelpWidth: () => process.stderr.isTTY ? process.stderr.columns : undefined,
      outputError: (str, write) => write(str)
    };

    this._hidden = false;
    this._hasHelpOption = true;
    this._helpFlags = '-h, --help';
    this._helpDescription = 'display help for command';
    this._helpShortFlag = '-h';
    this._helpLongFlag = '--help';
    this._addImplicitHelpCommand = undefined; // Deliberately undefined, not decided whether true or false
    this._helpCommandName = 'help';
    this._helpCommandnameAndArgs = 'help [command]';
    this._helpCommandDescription = 'display help for command';
    this._helpConfiguration = {};
  }

  /**
   * Copy settings that are useful to have in common across root command and subcommands.
   *
   * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
   *
   * @param {Command} sourceCommand
   * @return {Command} `this` command for chaining
   */
  copyInheritedSettings(sourceCommand) {
    this._outputConfiguration = sourceCommand._outputConfiguration;
    this._hasHelpOption = sourceCommand._hasHelpOption;
    this._helpFlags = sourceCommand._helpFlags;
    this._helpDescription = sourceCommand._helpDescription;
    this._helpShortFlag = sourceCommand._helpShortFlag;
    this._helpLongFlag = sourceCommand._helpLongFlag;
    this._helpCommandName = sourceCommand._helpCommandName;
    this._helpCommandnameAndArgs = sourceCommand._helpCommandnameAndArgs;
    this._helpCommandDescription = sourceCommand._helpCommandDescription;
    this._helpConfiguration = sourceCommand._helpConfiguration;
    this._exitCallback = sourceCommand._exitCallback;
    this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
    this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
    this._allowExcessArguments = sourceCommand._allowExcessArguments;
    this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
    this._showHelpAfterError = sourceCommand._showHelpAfterError;
    this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;

    return this;
  }

  /**
   * Define a command.
   *
   * There are two styles of command: pay attention to where to put the description.
   *
   * @example
   * // Command implemented using action handler (description is supplied separately to `.command`)
   * program
   *   .command('clone <source> [destination]')
   *   .description('clone a repository into a newly created directory')
   *   .action((source, destination) => {
   *     console.log('clone command called');
   *   });
   *
   * // Command implemented using separate executable file (description is second parameter to `.command`)
   * program
   *   .command('start <service>', 'start named service')
   *   .command('stop [service]', 'stop named service, or all if no name supplied');
   *
   * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
   * @param {Object|string} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
   * @param {Object} [execOpts] - configuration options (for executable)
   * @return {Command} returns new command for action handler, or `this` for executable command
   */

  command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
    let desc = actionOptsOrExecDesc;
    let opts = execOpts;
    if (typeof desc === 'object' && desc !== null) {
      opts = desc;
      desc = null;
    }
    opts = opts || {};
    const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);

    const cmd = this.createCommand(name);
    if (desc) {
      cmd.description(desc);
      cmd._executableHandler = true;
    }
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    cmd._hidden = !!(opts.noHelp || opts.hidden); // noHelp is deprecated old name for hidden
    cmd._executableFile = opts.executableFile || null; // Custom name for executable file, set missing to null to match constructor
    if (args) cmd.arguments(args);
    this.commands.push(cmd);
    cmd.parent = this;
    cmd.copyInheritedSettings(this);

    if (desc) return this;
    return cmd;
  }

  /**
   * Factory routine to create a new unattached command.
   *
   * See .command() for creating an attached subcommand, which uses this routine to
   * create the command. You can override createCommand to customise subcommands.
   *
   * @param {string} [name]
   * @return {Command} new command
   */

  createCommand(name) {
    return new Command(name);
  }

  /**
   * You can customise the help with a subclass of Help by overriding createHelp,
   * or by overriding Help properties using configureHelp().
   *
   * @return {Help}
   */

  createHelp() {
    return Object.assign(new Help(), this.configureHelp());
  }

  /**
   * You can customise the help by overriding Help properties using configureHelp(),
   * or with a subclass of Help by overriding createHelp().
   *
   * @param {Object} [configuration] - configuration options
   * @return {Command|Object} `this` command for chaining, or stored configuration
   */

  configureHelp(configuration) {
    if (configuration === undefined) return this._helpConfiguration;

    this._helpConfiguration = configuration;
    return this;
  }

  /**
   * The default output goes to stdout and stderr. You can customise this for special
   * applications. You can also customise the display of errors by overriding outputError.
   *
   * The configuration properties are all functions:
   *
   *     // functions to change where being written, stdout and stderr
   *     writeOut(str)
   *     writeErr(str)
   *     // matching functions to specify width for wrapping help
   *     getOutHelpWidth()
   *     getErrHelpWidth()
   *     // functions based on what is being written out
   *     outputError(str, write) // used for displaying errors, and not used for displaying help
   *
   * @param {Object} [configuration] - configuration options
   * @return {Command|Object} `this` command for chaining, or stored configuration
   */

  configureOutput(configuration) {
    if (configuration === undefined) return this._outputConfiguration;

    Object.assign(this._outputConfiguration, configuration);
    return this;
  }

  /**
   * Display the help or a custom message after an error occurs.
   *
   * @param {boolean|string} [displayHelp]
   * @return {Command} `this` command for chaining
   */
  showHelpAfterError(displayHelp = true) {
    if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
    this._showHelpAfterError = displayHelp;
    return this;
  }

  /**
   * Display suggestion of similar commands for unknown commands, or options for unknown options.
   *
   * @param {boolean} [displaySuggestion]
   * @return {Command} `this` command for chaining
   */
  showSuggestionAfterError(displaySuggestion = true) {
    this._showSuggestionAfterError = !!displaySuggestion;
    return this;
  }

  /**
   * Add a prepared subcommand.
   *
   * See .command() for creating an attached subcommand which inherits settings from its parent.
   *
   * @param {Command} cmd - new subcommand
   * @param {Object} [opts] - configuration options
   * @return {Command} `this` command for chaining
   */

  addCommand(cmd, opts) {
    if (!cmd._name) {
      throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
    }

    opts = opts || {};
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    if (opts.noHelp || opts.hidden) cmd._hidden = true; // modifying passed command due to existing implementation

    this.commands.push(cmd);
    cmd.parent = this;
    return this;
  }

  /**
   * Factory routine to create a new unattached argument.
   *
   * See .argument() for creating an attached argument, which uses this routine to
   * create the argument. You can override createArgument to return a custom argument.
   *
   * @param {string} name
   * @param {string} [description]
   * @return {Argument} new argument
   */

  createArgument(name, description) {
    return new Argument(name, description);
  }

  /**
   * Define argument syntax for command.
   *
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @example
   * program.argument('<input-file>');
   * program.argument('[output-file]');
   *
   * @param {string} name
   * @param {string} [description]
   * @param {Function|*} [fn] - custom argument processing function
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  argument(name, description, fn, defaultValue) {
    const argument = this.createArgument(name, description);
    if (typeof fn === 'function') {
      argument.default(defaultValue).argParser(fn);
    } else {
      argument.default(fn);
    }
    this.addArgument(argument);
    return this;
  }

  /**
   * Define argument syntax for command, adding multiple at once (without descriptions).
   *
   * See also .argument().
   *
   * @example
   * program.arguments('<cmd> [env]');
   *
   * @param {string} names
   * @return {Command} `this` command for chaining
   */

  arguments(names) {
    names.trim().split(/ +/).forEach((detail) => {
      this.argument(detail);
    });
    return this;
  }

  /**
   * Define argument syntax for command, adding a prepared argument.
   *
   * @param {Argument} argument
   * @return {Command} `this` command for chaining
   */
  addArgument(argument) {
    const previousArgument = this._args.slice(-1)[0];
    if (previousArgument && previousArgument.variadic) {
      throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
    }
    if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
      throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
    }
    this._args.push(argument);
    return this;
  }

  /**
   * Override default decision whether to add implicit help command.
   *
   *    addHelpCommand() // force on
   *    addHelpCommand(false); // force off
   *    addHelpCommand('help [cmd]', 'display help for [cmd]'); // force on with custom details
   *
   * @return {Command} `this` command for chaining
   */

  addHelpCommand(enableOrNameAndArgs, description) {
    if (enableOrNameAndArgs === false) {
      this._addImplicitHelpCommand = false;
    } else {
      this._addImplicitHelpCommand = true;
      if (typeof enableOrNameAndArgs === 'string') {
        this._helpCommandName = enableOrNameAndArgs.split(' ')[0];
        this._helpCommandnameAndArgs = enableOrNameAndArgs;
      }
      this._helpCommandDescription = description || this._helpCommandDescription;
    }
    return this;
  }

  /**
   * @return {boolean}
   * @api private
   */

  _hasImplicitHelpCommand() {
    if (this._addImplicitHelpCommand === undefined) {
      return this.commands.length && !this._actionHandler && !this._findCommand('help');
    }
    return this._addImplicitHelpCommand;
  }

  /**
   * Add hook for life cycle event.
   *
   * @param {string} event
   * @param {Function} listener
   * @return {Command} `this` command for chaining
   */

  hook(event, listener) {
    const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
    if (!allowedValues.includes(event)) {
      throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    if (this._lifeCycleHooks[event]) {
      this._lifeCycleHooks[event].push(listener);
    } else {
      this._lifeCycleHooks[event] = [listener];
    }
    return this;
  }

  /**
   * Register callback to use as replacement for calling process.exit.
   *
   * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
   * @return {Command} `this` command for chaining
   */

  exitOverride(fn) {
    if (fn) {
      this._exitCallback = fn;
    } else {
      this._exitCallback = (err) => {
        if (err.code !== 'commander.executeSubCommandAsync') {
          throw err;
        } else {
          // Async callback from spawn events, not useful to throw.
        }
      };
    }
    return this;
  }

  /**
   * Call process.exit, and _exitCallback if defined.
   *
   * @param {number} exitCode exit code for using with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @return never
   * @api private
   */

  _exit(exitCode, code, message) {
    if (this._exitCallback) {
      this._exitCallback(new CommanderError(exitCode, code, message));
      // Expecting this line is not reached.
    }
    process.exit(exitCode);
  }

  /**
   * Register callback `fn` for the command.
   *
   * @example
   * program
   *   .command('serve')
   *   .description('start service')
   *   .action(function() {
   *      // do work here
   *   });
   *
   * @param {Function} fn
   * @return {Command} `this` command for chaining
   */

  action(fn) {
    const listener = (args) => {
      // The .action callback takes an extra parameter which is the command or options.
      const expectedArgsCount = this._args.length;
      const actionArgs = args.slice(0, expectedArgsCount);
      if (this._storeOptionsAsProperties) {
        actionArgs[expectedArgsCount] = this; // backwards compatible "options"
      } else {
        actionArgs[expectedArgsCount] = this.opts();
      }
      actionArgs.push(this);

      return fn.apply(this, actionArgs);
    };
    this._actionHandler = listener;
    return this;
  }

  /**
   * Factory routine to create a new unattached option.
   *
   * See .option() for creating an attached option, which uses this routine to
   * create the option. You can override createOption to return a custom option.
   *
   * @param {string} flags
   * @param {string} [description]
   * @return {Option} new option
   */

  createOption(flags, description) {
    return new Option(flags, description);
  }

  /**
   * Add an option.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addOption(option) {
    const oname = option.name();
    const name = option.attributeName();

    // store default value
    if (option.negate) {
      // --no-foo is special and defaults foo to true, unless a --foo option is already defined
      const positiveLongFlag = option.long.replace(/^--no-/, '--');
      if (!this._findOption(positiveLongFlag)) {
        this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, 'default');
      }
    } else if (option.defaultValue !== undefined) {
      this.setOptionValueWithSource(name, option.defaultValue, 'default');
    }

    // register the option
    this.options.push(option);

    // handler for cli and env supplied values
    const handleOptionValue = (val, invalidValueMessage, valueSource) => {
      // val is null for optional option used without an optional-argument.
      // val is undefined for boolean and negated option.
      if (val == null && option.presetArg !== undefined) {
        val = option.presetArg;
      }

      // custom processing
      const oldValue = this.getOptionValue(name);
      if (val !== null && option.parseArg) {
        try {
          val = option.parseArg(val, oldValue);
        } catch (err) {
          if (err.code === 'commander.invalidArgument') {
            const message = `${invalidValueMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      } else if (val !== null && option.variadic) {
        val = option._concatValue(val, oldValue);
      }

      // Fill-in appropriate missing values. Long winded but easy to follow.
      if (val == null) {
        if (option.negate) {
          val = false;
        } else if (option.isBoolean() || option.optional) {
          val = true;
        } else {
          val = ''; // not normal, parseArg might have failed or be a mock function for testing
        }
      }
      this.setOptionValueWithSource(name, val, valueSource);
    };

    this.on('option:' + oname, (val) => {
      const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
      handleOptionValue(val, invalidValueMessage, 'cli');
    });

    if (option.envVar) {
      this.on('optionEnv:' + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, 'env');
      });
    }

    return this;
  }

  /**
   * Internal implementation shared by .option() and .requiredOption()
   *
   * @api private
   */
  _optionEx(config, flags, description, fn, defaultValue) {
    if (typeof flags === 'object' && flags instanceof Option) {
      throw new Error('To add an Option object use addOption() instead of option() or requiredOption()');
    }
    const option = this.createOption(flags, description);
    option.makeOptionMandatory(!!config.mandatory);
    if (typeof fn === 'function') {
      option.default(defaultValue).argParser(fn);
    } else if (fn instanceof RegExp) {
      // deprecated
      const regex = fn;
      fn = (val, def) => {
        const m = regex.exec(val);
        return m ? m[0] : def;
      };
      option.default(defaultValue).argParser(fn);
    } else {
      option.default(fn);
    }

    return this.addOption(option);
  }

  /**
   * Define option with `flags`, `description` and optional
   * coercion `fn`.
   *
   * The `flags` string contains the short and/or long flags,
   * separated by comma, a pipe or space. The following are all valid
   * all will output this way when `--help` is used.
   *
   *     "-p, --pepper"
   *     "-p|--pepper"
   *     "-p --pepper"
   *
   * @example
   * // simple boolean defaulting to undefined
   * program.option('-p, --pepper', 'add pepper');
   *
   * program.pepper
   * // => undefined
   *
   * --pepper
   * program.pepper
   * // => true
   *
   * // simple boolean defaulting to true (unless non-negated option is also defined)
   * program.option('-C, --no-cheese', 'remove cheese');
   *
   * program.cheese
   * // => true
   *
   * --no-cheese
   * program.cheese
   * // => false
   *
   * // required argument
   * program.option('-C, --chdir <path>', 'change the working directory');
   *
   * --chdir /tmp
   * program.chdir
   * // => "/tmp"
   *
   * // optional argument
   * program.option('-c, --cheese [type]', 'add cheese [marble]');
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {Function|*} [fn] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */

  option(flags, description, fn, defaultValue) {
    return this._optionEx({}, flags, description, fn, defaultValue);
  }

  /**
  * Add a required option which must have a value after parsing. This usually means
  * the option must be specified on the command line. (Otherwise the same as .option().)
  *
  * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
  *
  * @param {string} flags
  * @param {string} [description]
  * @param {Function|*} [fn] - custom option processing function or default value
  * @param {*} [defaultValue]
  * @return {Command} `this` command for chaining
  */

  requiredOption(flags, description, fn, defaultValue) {
    return this._optionEx({ mandatory: true }, flags, description, fn, defaultValue);
  }

  /**
   * Alter parsing of short flags with optional values.
   *
   * @example
   * // for `.option('-f,--flag [value]'):
   * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
   * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
   *
   * @param {Boolean} [combine=true] - if `true` or omitted, an optional value can be specified directly after the flag.
   */
  combineFlagAndOptionalValue(combine = true) {
    this._combineFlagAndOptionalValue = !!combine;
    return this;
  }

  /**
   * Allow unknown options on the command line.
   *
   * @param {Boolean} [allowUnknown=true] - if `true` or omitted, no error will be thrown
   * for unknown options.
   */
  allowUnknownOption(allowUnknown = true) {
    this._allowUnknownOption = !!allowUnknown;
    return this;
  }

  /**
   * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
   *
   * @param {Boolean} [allowExcess=true] - if `true` or omitted, no error will be thrown
   * for excess arguments.
   */
  allowExcessArguments(allowExcess = true) {
    this._allowExcessArguments = !!allowExcess;
    return this;
  }

  /**
   * Enable positional options. Positional means global options are specified before subcommands which lets
   * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
   * The default behaviour is non-positional and global options may appear anywhere on the command line.
   *
   * @param {Boolean} [positional=true]
   */
  enablePositionalOptions(positional = true) {
    this._enablePositionalOptions = !!positional;
    return this;
  }

  /**
   * Pass through options that come after command-arguments rather than treat them as command-options,
   * so actual command-options come before command-arguments. Turning this on for a subcommand requires
   * positional options to have been enabled on the program (parent commands).
   * The default behaviour is non-positional and options may appear before or after command-arguments.
   *
   * @param {Boolean} [passThrough=true]
   * for unknown options.
   */
  passThroughOptions(passThrough = true) {
    this._passThroughOptions = !!passThrough;
    if (!!this.parent && passThrough && !this.parent._enablePositionalOptions) {
      throw new Error('passThroughOptions can not be used without turning on enablePositionalOptions for parent command(s)');
    }
    return this;
  }

  /**
    * Whether to store option values as properties on command object,
    * or store separately (specify false). In both cases the option values can be accessed using .opts().
    *
    * @param {boolean} [storeAsProperties=true]
    * @return {Command} `this` command for chaining
    */

  storeOptionsAsProperties(storeAsProperties = true) {
    this._storeOptionsAsProperties = !!storeAsProperties;
    if (this.options.length) {
      throw new Error('call .storeOptionsAsProperties() before adding options');
    }
    return this;
  }

  /**
   * Retrieve option value.
   *
   * @param {string} key
   * @return {Object} value
   */

  getOptionValue(key) {
    if (this._storeOptionsAsProperties) {
      return this[key];
    }
    return this._optionValues[key];
  }

  /**
   * Store option value.
   *
   * @param {string} key
   * @param {Object} value
   * @return {Command} `this` command for chaining
   */

  setOptionValue(key, value) {
    return this.setOptionValueWithSource(key, value, undefined);
  }

  /**
    * Store option value and where the value came from.
    *
    * @param {string} key
    * @param {Object} value
    * @param {string} source - expected values are default/config/env/cli/implied
    * @return {Command} `this` command for chaining
    */

  setOptionValueWithSource(key, value, source) {
    if (this._storeOptionsAsProperties) {
      this[key] = value;
    } else {
      this._optionValues[key] = value;
    }
    this._optionValueSources[key] = source;
    return this;
  }

  /**
    * Get source of option value.
    * Expected values are default | config | env | cli | implied
    *
    * @param {string} key
    * @return {string}
    */

  getOptionValueSource(key) {
    return this._optionValueSources[key];
  }

  /**
    * Get source of option value. See also .optsWithGlobals().
    * Expected values are default | config | env | cli | implied
    *
    * @param {string} key
    * @return {string}
    */

  getOptionValueSourceWithGlobals(key) {
    // global overwrites local, like optsWithGlobals
    let source;
    getCommandAndParents(this).forEach((cmd) => {
      if (cmd.getOptionValueSource(key) !== undefined) {
        source = cmd.getOptionValueSource(key);
      }
    });
    return source;
  }

  /**
   * Get user arguments from implied or explicit arguments.
   * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
   *
   * @api private
   */

  _prepareUserArgs(argv, parseOptions) {
    if (argv !== undefined && !Array.isArray(argv)) {
      throw new Error('first parameter to parse must be array or undefined');
    }
    parseOptions = parseOptions || {};

    // Default to using process.argv
    if (argv === undefined) {
      argv = process.argv;
      // @ts-ignore: unknown property
      if (process.versions && process.versions.electron) {
        parseOptions.from = 'electron';
      }
    }
    this.rawArgs = argv.slice();

    // make it a little easier for callers by supporting various argv conventions
    let userArgs;
    switch (parseOptions.from) {
      case undefined:
      case 'node':
        this._scriptPath = argv[1];
        userArgs = argv.slice(2);
        break;
      case 'electron':
        // @ts-ignore: unknown property
        if (process.defaultApp) {
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
        } else {
          userArgs = argv.slice(1);
        }
        break;
      case 'user':
        userArgs = argv.slice(0);
        break;
      default:
        throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
    }

    // Find default name for program from arguments.
    if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
    this._name = this._name || 'program';

    return userArgs;
  }

  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * The default expectation is that the arguments are from node and have the application as argv[0]
   * and the script being run in argv[1], with user parameters after that.
   *
   * @example
   * program.parse(process.argv);
   * program.parse(); // implicitly use process.argv and auto-detect node vs electron conventions
   * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv] - optional, defaults to process.argv
   * @param {Object} [parseOptions] - optionally specify style of options with from: node/user/electron
   * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
   * @return {Command} `this` command for chaining
   */

  parse(argv, parseOptions) {
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    this._parseCommand([], userArgs);

    return this;
  }

  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Use parseAsync instead of parse if any of your action handlers are async. Returns a Promise.
   *
   * The default expectation is that the arguments are from node and have the application as argv[0]
   * and the script being run in argv[1], with user parameters after that.
   *
   * @example
   * await program.parseAsync(process.argv);
   * await program.parseAsync(); // implicitly use process.argv and auto-detect node vs electron conventions
   * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv]
   * @param {Object} [parseOptions]
   * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
   * @return {Promise}
   */

  async parseAsync(argv, parseOptions) {
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    await this._parseCommand([], userArgs);

    return this;
  }

  /**
   * Execute a sub-command executable.
   *
   * @api private
   */

  _executeSubCommand(subcommand, args) {
    args = args.slice();
    let launchWithNode = false; // Use node for source targets so do not need to get permissions correct, and on Windows.
    const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];

    function findFile(baseDir, baseName) {
      // Look for specified file
      const localBin = path.resolve(baseDir, baseName);
      if (fs.existsSync(localBin)) return localBin;

      // Stop looking if candidate already has an expected extension.
      if (sourceExt.includes(path.extname(baseName))) return undefined;

      // Try all the extensions.
      const foundExt = sourceExt.find(ext => fs.existsSync(`${localBin}${ext}`));
      if (foundExt) return `${localBin}${foundExt}`;

      return undefined;
    }

    // Not checking for help first. Unlikely to have mandatory and executable, and can't robustly test for help flags in external command.
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();

    // executableFile and executableDir might be full path, or just a name
    let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
    let executableDir = this._executableDir || '';
    if (this._scriptPath) {
      let resolvedScriptPath; // resolve possible symlink for installed npm binary
      try {
        resolvedScriptPath = fs.realpathSync(this._scriptPath);
      } catch (err) {
        resolvedScriptPath = this._scriptPath;
      }
      executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
    }

    // Look for a local file in preference to a command in PATH.
    if (executableDir) {
      let localFile = findFile(executableDir, executableFile);

      // Legacy search using prefix of script name instead of command name
      if (!localFile && !subcommand._executableFile && this._scriptPath) {
        const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
        if (legacyName !== this._name) {
          localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
        }
      }
      executableFile = localFile || executableFile;
    }

    launchWithNode = sourceExt.includes(path.extname(executableFile));

    let proc;
    if (process.platform !== 'win32') {
      if (launchWithNode) {
        args.unshift(executableFile);
        // add executable arguments to spawn
        args = incrementNodeInspectorPort(process.execArgv).concat(args);

        proc = childProcess.spawn(process.argv[0], args, { stdio: 'inherit' });
      } else {
        proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
      }
    } else {
      args.unshift(executableFile);
      // add executable arguments to spawn
      args = incrementNodeInspectorPort(process.execArgv).concat(args);
      proc = childProcess.spawn(process.execPath, args, { stdio: 'inherit' });
    }

    if (!proc.killed) { // testing mainly to avoid leak warnings during unit tests with mocked spawn
      const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
      signals.forEach((signal) => {
        // @ts-ignore
        process.on(signal, () => {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
    }

    // By default terminate process when spawned process terminates.
    // Suppressing the exit if exitCallback defined is a bit messy and of limited use, but does allow process to stay running!
    const exitCallback = this._exitCallback;
    if (!exitCallback) {
      proc.on('close', process.exit.bind(process));
    } else {
      proc.on('close', () => {
        exitCallback(new CommanderError(process.exitCode || 0, 'commander.executeSubCommandAsync', '(close)'));
      });
    }
    proc.on('error', (err) => {
      // @ts-ignore
      if (err.code === 'ENOENT') {
        const executableDirMessage = executableDir
          ? `searched for local subcommand relative to directory '${executableDir}'`
          : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      // @ts-ignore
      } else if (err.code === 'EACCES') {
        throw new Error(`'${executableFile}' not executable`);
      }
      if (!exitCallback) {
        process.exit(1);
      } else {
        const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
        wrappedError.nestedError = err;
        exitCallback(wrappedError);
      }
    });

    // Store the reference to the child process
    this.runningCommand = proc;
  }

  /**
   * @api private
   */

  _dispatchSubcommand(commandName, operands, unknown) {
    const subCommand = this._findCommand(commandName);
    if (!subCommand) this.help({ error: true });

    let hookResult;
    hookResult = this._chainOrCallSubCommandHook(hookResult, subCommand, 'preSubcommand');
    hookResult = this._chainOrCall(hookResult, () => {
      if (subCommand._executableHandler) {
        this._executeSubCommand(subCommand, operands.concat(unknown));
      } else {
        return subCommand._parseCommand(operands, unknown);
      }
    });
    return hookResult;
  }

  /**
   * Invoke help directly if possible, or dispatch if necessary.
   * e.g. help foo
   *
   * @api private
   */

  _dispatchHelpCommand(subcommandName) {
    if (!subcommandName) {
      this.help();
    }
    const subCommand = this._findCommand(subcommandName);
    if (subCommand && !subCommand._executableHandler) {
      subCommand.help();
    }

    // Fallback to parsing the help flag to invoke the help.
    return this._dispatchSubcommand(subcommandName, [], [this._helpLongFlag]);
  }

  /**
   * Check this.args against expected this._args.
   *
   * @api private
   */

  _checkNumberOfArguments() {
    // too few
    this._args.forEach((arg, i) => {
      if (arg.required && this.args[i] == null) {
        this.missingArgument(arg.name());
      }
    });
    // too many
    if (this._args.length > 0 && this._args[this._args.length - 1].variadic) {
      return;
    }
    if (this.args.length > this._args.length) {
      this._excessArguments(this.args);
    }
  }

  /**
   * Process this.args using this._args and save as this.processedArgs!
   *
   * @api private
   */

  _processArguments() {
    const myParseArg = (argument, value, previous) => {
      // Extra processing for nice error message on parsing failure.
      let parsedValue = value;
      if (value !== null && argument.parseArg) {
        try {
          parsedValue = argument.parseArg(value, previous);
        } catch (err) {
          if (err.code === 'commander.invalidArgument') {
            const message = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'. ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      return parsedValue;
    };

    this._checkNumberOfArguments();

    const processedArgs = [];
    this._args.forEach((declaredArg, index) => {
      let value = declaredArg.defaultValue;
      if (declaredArg.variadic) {
        // Collect together remaining arguments for passing together as an array.
        if (index < this.args.length) {
          value = this.args.slice(index);
          if (declaredArg.parseArg) {
            value = value.reduce((processed, v) => {
              return myParseArg(declaredArg, v, processed);
            }, declaredArg.defaultValue);
          }
        } else if (value === undefined) {
          value = [];
        }
      } else if (index < this.args.length) {
        value = this.args[index];
        if (declaredArg.parseArg) {
          value = myParseArg(declaredArg, value, declaredArg.defaultValue);
        }
      }
      processedArgs[index] = value;
    });
    this.processedArgs = processedArgs;
  }

  /**
   * Once we have a promise we chain, but call synchronously until then.
   *
   * @param {Promise|undefined} promise
   * @param {Function} fn
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCall(promise, fn) {
    // thenable
    if (promise && promise.then && typeof promise.then === 'function') {
      // already have a promise, chain callback
      return promise.then(() => fn());
    }
    // callback might return a promise
    return fn();
  }

  /**
   *
   * @param {Promise|undefined} promise
   * @param {string} event
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCallHooks(promise, event) {
    let result = promise;
    const hooks = [];
    getCommandAndParents(this)
      .reverse()
      .filter(cmd => cmd._lifeCycleHooks[event] !== undefined)
      .forEach(hookedCommand => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
    if (event === 'postAction') {
      hooks.reverse();
    }

    hooks.forEach((hookDetail) => {
      result = this._chainOrCall(result, () => {
        return hookDetail.callback(hookDetail.hookedCommand, this);
      });
    });
    return result;
  }

  /**
   *
   * @param {Promise|undefined} promise
   * @param {Command} subCommand
   * @param {string} event
   * @return {Promise|undefined}
   * @api private
   */

  _chainOrCallSubCommandHook(promise, subCommand, event) {
    let result = promise;
    if (this._lifeCycleHooks[event] !== undefined) {
      this._lifeCycleHooks[event].forEach((hook) => {
        result = this._chainOrCall(result, () => {
          return hook(this, subCommand);
        });
      });
    }
    return result;
  }

  /**
   * Process arguments in context of this command.
   * Returns action result, in case it is a promise.
   *
   * @api private
   */

  _parseCommand(operands, unknown) {
    const parsed = this.parseOptions(unknown);
    this._parseOptionsEnv(); // after cli, so parseArg not called on both cli and env
    this._parseOptionsImplied();
    operands = operands.concat(parsed.operands);
    unknown = parsed.unknown;
    this.args = operands.concat(unknown);

    if (operands && this._findCommand(operands[0])) {
      return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
    }
    if (this._hasImplicitHelpCommand() && operands[0] === this._helpCommandName) {
      return this._dispatchHelpCommand(operands[1]);
    }
    if (this._defaultCommandName) {
      outputHelpIfRequested(this, unknown); // Run the help for default command from parent rather than passing to default command
      return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
    }
    if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
      // probably missing subcommand and no handler, user needs help (and exit)
      this.help({ error: true });
    }

    outputHelpIfRequested(this, parsed.unknown);
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();

    // We do not always call this check to avoid masking a "better" error, like unknown command.
    const checkForUnknownOptions = () => {
      if (parsed.unknown.length > 0) {
        this.unknownOption(parsed.unknown[0]);
      }
    };

    const commandEvent = `command:${this.name()}`;
    if (this._actionHandler) {
      checkForUnknownOptions();
      this._processArguments();

      let actionResult;
      actionResult = this._chainOrCallHooks(actionResult, 'preAction');
      actionResult = this._chainOrCall(actionResult, () => this._actionHandler(this.processedArgs));
      if (this.parent) {
        actionResult = this._chainOrCall(actionResult, () => {
          this.parent.emit(commandEvent, operands, unknown); // legacy
        });
      }
      actionResult = this._chainOrCallHooks(actionResult, 'postAction');
      return actionResult;
    }
    if (this.parent && this.parent.listenerCount(commandEvent)) {
      checkForUnknownOptions();
      this._processArguments();
      this.parent.emit(commandEvent, operands, unknown); // legacy
    } else if (operands.length) {
      if (this._findCommand('*')) { // legacy default command
        return this._dispatchSubcommand('*', operands, unknown);
      }
      if (this.listenerCount('command:*')) {
        // skip option check, emit event for possible misspelling suggestion
        this.emit('command:*', operands, unknown);
      } else if (this.commands.length) {
        this.unknownCommand();
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    } else if (this.commands.length) {
      checkForUnknownOptions();
      // This command has subcommands and nothing hooked up at this level, so display help (and exit).
      this.help({ error: true });
    } else {
      checkForUnknownOptions();
      this._processArguments();
      // fall through for caller to handle after calling .parse()
    }
  }

  /**
   * Find matching command.
   *
   * @api private
   */
  _findCommand(name) {
    if (!name) return undefined;
    return this.commands.find(cmd => cmd._name === name || cmd._aliases.includes(name));
  }

  /**
   * Return an option matching `arg` if any.
   *
   * @param {string} arg
   * @return {Option}
   * @api private
   */

  _findOption(arg) {
    return this.options.find(option => option.is(arg));
  }

  /**
   * Display an error message if a mandatory option does not have a value.
   * Called after checking for help flags in leaf subcommand.
   *
   * @api private
   */

  _checkForMissingMandatoryOptions() {
    // Walk up hierarchy so can call in subcommand after checking for displaying help.
    for (let cmd = this; cmd; cmd = cmd.parent) {
      cmd.options.forEach((anOption) => {
        if (anOption.mandatory && (cmd.getOptionValue(anOption.attributeName()) === undefined)) {
          cmd.missingMandatoryOptionValue(anOption);
        }
      });
    }
  }

  /**
   * Display an error message if conflicting options are used together in this.
   *
   * @api private
   */
  _checkForConflictingLocalOptions() {
    const definedNonDefaultOptions = this.options.filter(
      (option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== 'default';
      }
    );

    const optionsWithConflicting = definedNonDefaultOptions.filter(
      (option) => option.conflictsWith.length > 0
    );

    optionsWithConflicting.forEach((option) => {
      const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
        option.conflictsWith.includes(defined.attributeName())
      );
      if (conflictingAndDefined) {
        this._conflictingOption(option, conflictingAndDefined);
      }
    });
  }

  /**
   * Display an error message if conflicting options are used together.
   * Called after checking for help flags in leaf subcommand.
   *
   * @api private
   */
  _checkForConflictingOptions() {
    // Walk up hierarchy so can call in subcommand after checking for displaying help.
    for (let cmd = this; cmd; cmd = cmd.parent) {
      cmd._checkForConflictingLocalOptions();
    }
  }

  /**
   * Parse options from `argv` removing known options,
   * and return argv split into operands and unknown arguments.
   *
   * Examples:
   *
   *     argv => operands, unknown
   *     --known kkk op => [op], []
   *     op --known kkk => [op], []
   *     sub --unknown uuu op => [sub], [--unknown uuu op]
   *     sub -- --unknown uuu op => [sub --unknown uuu op], []
   *
   * @param {String[]} argv
   * @return {{operands: String[], unknown: String[]}}
   */

  parseOptions(argv) {
    const operands = []; // operands, not options or values
    const unknown = []; // first unknown option and remaining unknown args
    let dest = operands;
    const args = argv.slice();

    function maybeOption(arg) {
      return arg.length > 1 && arg[0] === '-';
    }

    // parse options
    let activeVariadicOption = null;
    while (args.length) {
      const arg = args.shift();

      // literal
      if (arg === '--') {
        if (dest === unknown) dest.push(arg);
        dest.push(...args);
        break;
      }

      if (activeVariadicOption && !maybeOption(arg)) {
        this.emit(`option:${activeVariadicOption.name()}`, arg);
        continue;
      }
      activeVariadicOption = null;

      if (maybeOption(arg)) {
        const option = this._findOption(arg);
        // recognised option, call listener to assign value with possible custom processing
        if (option) {
          if (option.required) {
            const value = args.shift();
            if (value === undefined) this.optionMissingArgument(option);
            this.emit(`option:${option.name()}`, value);
          } else if (option.optional) {
            let value = null;
            // historical behaviour is optional value is following arg unless an option
            if (args.length > 0 && !maybeOption(args[0])) {
              value = args.shift();
            }
            this.emit(`option:${option.name()}`, value);
          } else { // boolean flag
            this.emit(`option:${option.name()}`);
          }
          activeVariadicOption = option.variadic ? option : null;
          continue;
        }
      }

      // Look for combo options following single dash, eat first one if known.
      if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
        const option = this._findOption(`-${arg[1]}`);
        if (option) {
          if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
            // option with value following in same argument
            this.emit(`option:${option.name()}`, arg.slice(2));
          } else {
            // boolean option, emit and put back remainder of arg for further processing
            this.emit(`option:${option.name()}`);
            args.unshift(`-${arg.slice(2)}`);
          }
          continue;
        }
      }

      // Look for known long flag with value, like --foo=bar
      if (/^--[^=]+=/.test(arg)) {
        const index = arg.indexOf('=');
        const option = this._findOption(arg.slice(0, index));
        if (option && (option.required || option.optional)) {
          this.emit(`option:${option.name()}`, arg.slice(index + 1));
          continue;
        }
      }

      // Not a recognised option by this command.
      // Might be a command-argument, or subcommand option, or unknown option, or help command or option.

      // An unknown option means further arguments also classified as unknown so can be reprocessed by subcommands.
      if (maybeOption(arg)) {
        dest = unknown;
      }

      // If using positionalOptions, stop processing our options at subcommand.
      if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
        if (this._findCommand(arg)) {
          operands.push(arg);
          if (args.length > 0) unknown.push(...args);
          break;
        } else if (arg === this._helpCommandName && this._hasImplicitHelpCommand()) {
          operands.push(arg);
          if (args.length > 0) operands.push(...args);
          break;
        } else if (this._defaultCommandName) {
          unknown.push(arg);
          if (args.length > 0) unknown.push(...args);
          break;
        }
      }

      // If using passThroughOptions, stop processing options at first command-argument.
      if (this._passThroughOptions) {
        dest.push(arg);
        if (args.length > 0) dest.push(...args);
        break;
      }

      // add arg
      dest.push(arg);
    }

    return { operands, unknown };
  }

  /**
   * Return an object containing local option values as key-value pairs.
   *
   * @return {Object}
   */
  opts() {
    if (this._storeOptionsAsProperties) {
      // Preserve original behaviour so backwards compatible when still using properties
      const result = {};
      const len = this.options.length;

      for (let i = 0; i < len; i++) {
        const key = this.options[i].attributeName();
        result[key] = key === this._versionOptionName ? this._version : this[key];
      }
      return result;
    }

    return this._optionValues;
  }

  /**
   * Return an object containing merged local and global option values as key-value pairs.
   *
   * @return {Object}
   */
  optsWithGlobals() {
    // globals overwrite locals
    return getCommandAndParents(this).reduce(
      (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
      {}
    );
  }

  /**
   * Display error message and exit (or call exitOverride).
   *
   * @param {string} message
   * @param {Object} [errorOptions]
   * @param {string} [errorOptions.code] - an id string representing the error
   * @param {number} [errorOptions.exitCode] - used with process.exit
   */
  error(message, errorOptions) {
    // output handling
    this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
    if (typeof this._showHelpAfterError === 'string') {
      this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
    } else if (this._showHelpAfterError) {
      this._outputConfiguration.writeErr('\n');
      this.outputHelp({ error: true });
    }

    // exit handling
    const config = errorOptions || {};
    const exitCode = config.exitCode || 1;
    const code = config.code || 'commander.error';
    this._exit(exitCode, code, message);
  }

  /**
   * Apply any option related environment variables, if option does
   * not have a value from cli or client code.
   *
   * @api private
   */
  _parseOptionsEnv() {
    this.options.forEach((option) => {
      if (option.envVar && option.envVar in process.env) {
        const optionKey = option.attributeName();
        // Priority check. Do not overwrite cli or options from unknown source (client-code).
        if (this.getOptionValue(optionKey) === undefined || ['default', 'config', 'env'].includes(this.getOptionValueSource(optionKey))) {
          if (option.required || option.optional) { // option can take a value
            // keep very simple, optional always takes value
            this.emit(`optionEnv:${option.name()}`, process.env[option.envVar]);
          } else { // boolean
            // keep very simple, only care that envVar defined and not the value
            this.emit(`optionEnv:${option.name()}`);
          }
        }
      }
    });
  }

  /**
   * Apply any implied option values, if option is undefined or default value.
   *
   * @api private
   */
  _parseOptionsImplied() {
    const dualHelper = new DualOptions(this.options);
    const hasCustomOptionValue = (optionKey) => {
      return this.getOptionValue(optionKey) !== undefined && !['default', 'implied'].includes(this.getOptionValueSource(optionKey));
    };
    this.options
      .filter(option => (option.implied !== undefined) &&
        hasCustomOptionValue(option.attributeName()) &&
        dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option))
      .forEach((option) => {
        Object.keys(option.implied)
          .filter(impliedKey => !hasCustomOptionValue(impliedKey))
          .forEach(impliedKey => {
            this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
          });
      });
  }

  /**
   * Argument `name` is missing.
   *
   * @param {string} name
   * @api private
   */

  missingArgument(name) {
    const message = `error: missing required argument '${name}'`;
    this.error(message, { code: 'commander.missingArgument' });
  }

  /**
   * `Option` is missing an argument.
   *
   * @param {Option} option
   * @api private
   */

  optionMissingArgument(option) {
    const message = `error: option '${option.flags}' argument missing`;
    this.error(message, { code: 'commander.optionMissingArgument' });
  }

  /**
   * `Option` does not have a value, and is a mandatory option.
   *
   * @param {Option} option
   * @api private
   */

  missingMandatoryOptionValue(option) {
    const message = `error: required option '${option.flags}' not specified`;
    this.error(message, { code: 'commander.missingMandatoryOptionValue' });
  }

  /**
   * `Option` conflicts with another option.
   *
   * @param {Option} option
   * @param {Option} conflictingOption
   * @api private
   */
  _conflictingOption(option, conflictingOption) {
    // The calling code does not know whether a negated option is the source of the
    // value, so do some work to take an educated guess.
    const findBestOptionFromValue = (option) => {
      const optionKey = option.attributeName();
      const optionValue = this.getOptionValue(optionKey);
      const negativeOption = this.options.find(target => target.negate && optionKey === target.attributeName());
      const positiveOption = this.options.find(target => !target.negate && optionKey === target.attributeName());
      if (negativeOption && (
        (negativeOption.presetArg === undefined && optionValue === false) ||
        (negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)
      )) {
        return negativeOption;
      }
      return positiveOption || option;
    };

    const getErrorMessage = (option) => {
      const bestOption = findBestOptionFromValue(option);
      const optionKey = bestOption.attributeName();
      const source = this.getOptionValueSource(optionKey);
      if (source === 'env') {
        return `environment variable '${bestOption.envVar}'`;
      }
      return `option '${bestOption.flags}'`;
    };

    const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
    this.error(message, { code: 'commander.conflictingOption' });
  }

  /**
   * Unknown option `flag`.
   *
   * @param {string} flag
   * @api private
   */

  unknownOption(flag) {
    if (this._allowUnknownOption) return;
    let suggestion = '';

    if (flag.startsWith('--') && this._showSuggestionAfterError) {
      // Looping to pick up the global options too
      let candidateFlags = [];
      let command = this;
      do {
        const moreFlags = command.createHelp().visibleOptions(command)
          .filter(option => option.long)
          .map(option => option.long);
        candidateFlags = candidateFlags.concat(moreFlags);
        command = command.parent;
      } while (command && !command._enablePositionalOptions);
      suggestion = suggestSimilar(flag, candidateFlags);
    }

    const message = `error: unknown option '${flag}'${suggestion}`;
    this.error(message, { code: 'commander.unknownOption' });
  }

  /**
   * Excess arguments, more than expected.
   *
   * @param {string[]} receivedArgs
   * @api private
   */

  _excessArguments(receivedArgs) {
    if (this._allowExcessArguments) return;

    const expected = this._args.length;
    const s = (expected === 1) ? '' : 's';
    const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
    const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
    this.error(message, { code: 'commander.excessArguments' });
  }

  /**
   * Unknown command.
   *
   * @api private
   */

  unknownCommand() {
    const unknownName = this.args[0];
    let suggestion = '';

    if (this._showSuggestionAfterError) {
      const candidateNames = [];
      this.createHelp().visibleCommands(this).forEach((command) => {
        candidateNames.push(command.name());
        // just visible alias
        if (command.alias()) candidateNames.push(command.alias());
      });
      suggestion = suggestSimilar(unknownName, candidateNames);
    }

    const message = `error: unknown command '${unknownName}'${suggestion}`;
    this.error(message, { code: 'commander.unknownCommand' });
  }

  /**
   * Set the program version to `str`.
   *
   * This method auto-registers the "-V, --version" flag
   * which will print the version number when passed.
   *
   * You can optionally supply the  flags and description to override the defaults.
   *
   * @param {string} str
   * @param {string} [flags]
   * @param {string} [description]
   * @return {this | string} `this` command for chaining, or version string if no arguments
   */

  version(str, flags, description) {
    if (str === undefined) return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    description = description || 'output the version number';
    const versionOption = this.createOption(flags, description);
    this._versionOptionName = versionOption.attributeName();
    this.options.push(versionOption);
    this.on('option:' + versionOption.name(), () => {
      this._outputConfiguration.writeOut(`${str}\n`);
      this._exit(0, 'commander.version', str);
    });
    return this;
  }

  /**
   * Set the description.
   *
   * @param {string} [str]
   * @param {Object} [argsDescription]
   * @return {string|Command}
   */
  description(str, argsDescription) {
    if (str === undefined && argsDescription === undefined) return this._description;
    this._description = str;
    if (argsDescription) {
      this._argsDescription = argsDescription;
    }
    return this;
  }

  /**
   * Set the summary. Used when listed as subcommand of parent.
   *
   * @param {string} [str]
   * @return {string|Command}
   */
  summary(str) {
    if (str === undefined) return this._summary;
    this._summary = str;
    return this;
  }

  /**
   * Set an alias for the command.
   *
   * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
   *
   * @param {string} [alias]
   * @return {string|Command}
   */

  alias(alias) {
    if (alias === undefined) return this._aliases[0]; // just return first, for backwards compatibility

    /** @type {Command} */
    let command = this;
    if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
      // assume adding alias for last added executable subcommand, rather than this
      command = this.commands[this.commands.length - 1];
    }

    if (alias === command._name) throw new Error('Command alias can\'t be the same as its name');

    command._aliases.push(alias);
    return this;
  }

  /**
   * Set aliases for the command.
   *
   * Only the first alias is shown in the auto-generated help.
   *
   * @param {string[]} [aliases]
   * @return {string[]|Command}
   */

  aliases(aliases) {
    // Getter for the array of aliases is the main reason for having aliases() in addition to alias().
    if (aliases === undefined) return this._aliases;

    aliases.forEach((alias) => this.alias(alias));
    return this;
  }

  /**
   * Set / get the command usage `str`.
   *
   * @param {string} [str]
   * @return {String|Command}
   */

  usage(str) {
    if (str === undefined) {
      if (this._usage) return this._usage;

      const args = this._args.map((arg) => {
        return humanReadableArgName(arg);
      });
      return [].concat(
        (this.options.length || this._hasHelpOption ? '[options]' : []),
        (this.commands.length ? '[command]' : []),
        (this._args.length ? args : [])
      ).join(' ');
    }

    this._usage = str;
    return this;
  }

  /**
   * Get or set the name of the command.
   *
   * @param {string} [str]
   * @return {string|Command}
   */

  name(str) {
    if (str === undefined) return this._name;
    this._name = str;
    return this;
  }

  /**
   * Set the name of the command from script filename, such as process.argv[1],
   * or require.main.filename, or __filename.
   *
   * (Used internally and public although not documented in README.)
   *
   * @example
   * program.nameFromFilename(require.main.filename);
   *
   * @param {string} filename
   * @return {Command}
   */

  nameFromFilename(filename) {
    this._name = path.basename(filename, path.extname(filename));

    return this;
  }

  /**
   * Get or set the directory for searching for executable subcommands of this command.
   *
   * @example
   * program.executableDir(__dirname);
   * // or
   * program.executableDir('subcommands');
   *
   * @param {string} [path]
   * @return {string|Command}
   */

  executableDir(path) {
    if (path === undefined) return this._executableDir;
    this._executableDir = path;
    return this;
  }

  /**
   * Return program help documentation.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
   * @return {string}
   */

  helpInformation(contextOptions) {
    const helper = this.createHelp();
    if (helper.helpWidth === undefined) {
      helper.helpWidth = (contextOptions && contextOptions.error) ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
    }
    return helper.formatHelp(this, helper);
  }

  /**
   * @api private
   */

  _getHelpContext(contextOptions) {
    contextOptions = contextOptions || {};
    const context = { error: !!contextOptions.error };
    let write;
    if (context.error) {
      write = (arg) => this._outputConfiguration.writeErr(arg);
    } else {
      write = (arg) => this._outputConfiguration.writeOut(arg);
    }
    context.write = contextOptions.write || write;
    context.command = this;
    return context;
  }

  /**
   * Output help information for this command.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */

  outputHelp(contextOptions) {
    let deprecatedCallback;
    if (typeof contextOptions === 'function') {
      deprecatedCallback = contextOptions;
      contextOptions = undefined;
    }
    const context = this._getHelpContext(contextOptions);

    getCommandAndParents(this).reverse().forEach(command => command.emit('beforeAllHelp', context));
    this.emit('beforeHelp', context);

    let helpInformation = this.helpInformation(context);
    if (deprecatedCallback) {
      helpInformation = deprecatedCallback(helpInformation);
      if (typeof helpInformation !== 'string' && !Buffer.isBuffer(helpInformation)) {
        throw new Error('outputHelp callback must return a string or a Buffer');
      }
    }
    context.write(helpInformation);

    this.emit(this._helpLongFlag); // deprecated
    this.emit('afterHelp', context);
    getCommandAndParents(this).forEach(command => command.emit('afterAllHelp', context));
  }

  /**
   * You can pass in flags and a description to override the help
   * flags and help description for your command. Pass in false to
   * disable the built-in help option.
   *
   * @param {string | boolean} [flags]
   * @param {string} [description]
   * @return {Command} `this` command for chaining
   */

  helpOption(flags, description) {
    if (typeof flags === 'boolean') {
      this._hasHelpOption = flags;
      return this;
    }
    this._helpFlags = flags || this._helpFlags;
    this._helpDescription = description || this._helpDescription;

    const helpFlags = splitOptionFlags(this._helpFlags);
    this._helpShortFlag = helpFlags.shortFlag;
    this._helpLongFlag = helpFlags.longFlag;

    return this;
  }

  /**
   * Output help information and exit.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */

  help(contextOptions) {
    this.outputHelp(contextOptions);
    let exitCode = process.exitCode || 0;
    if (exitCode === 0 && contextOptions && typeof contextOptions !== 'function' && contextOptions.error) {
      exitCode = 1;
    }
    // message: do not have all displayed text available so only passing placeholder.
    this._exit(exitCode, 'commander.help', '(outputHelp)');
  }

  /**
   * Add additional text to be displayed with the built-in help.
   *
   * Position is 'before' or 'after' to affect just this command,
   * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
   *
   * @param {string} position - before or after built-in help
   * @param {string | Function} text - string to add, or a function returning a string
   * @return {Command} `this` command for chaining
   */
  addHelpText(position, text) {
    const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
    if (!allowedValues.includes(position)) {
      throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    const helpEvent = `${position}Help`;
    this.on(helpEvent, (context) => {
      let helpStr;
      if (typeof text === 'function') {
        helpStr = text({ error: context.error, command: context.command });
      } else {
        helpStr = text;
      }
      // Ignore falsy value when nothing to output.
      if (helpStr) {
        context.write(`${helpStr}\n`);
      }
    });
    return this;
  }
}

/**
 * Output help information if help flags specified
 *
 * @param {Command} cmd - command to output help for
 * @param {Array} args - array of options to search for help flags
 * @api private
 */

function outputHelpIfRequested(cmd, args) {
  const helpOption = cmd._hasHelpOption && args.find(arg => arg === cmd._helpLongFlag || arg === cmd._helpShortFlag);
  if (helpOption) {
    cmd.outputHelp();
    // (Do not have all displayed text available so only passing placeholder.)
    cmd._exit(0, 'commander.helpDisplayed', '(outputHelp)');
  }
}

/**
 * Scan arguments and increment port number for inspect calls (to avoid conflicts when spawning new command).
 *
 * @param {string[]} args - array of arguments from node.execArgv
 * @returns {string[]}
 * @api private
 */

function incrementNodeInspectorPort(args) {
  // Testing for these options:
  //  --inspect[=[host:]port]
  //  --inspect-brk[=[host:]port]
  //  --inspect-port=[host:]port
  return args.map((arg) => {
    if (!arg.startsWith('--inspect')) {
      return arg;
    }
    let debugOption;
    let debugHost = '127.0.0.1';
    let debugPort = '9229';
    let match;
    if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
      // e.g. --inspect
      debugOption = match[1];
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
      debugOption = match[1];
      if (/^\d+$/.test(match[3])) {
        // e.g. --inspect=1234
        debugPort = match[3];
      } else {
        // e.g. --inspect=localhost
        debugHost = match[3];
      }
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
      // e.g. --inspect=localhost:1234
      debugOption = match[1];
      debugHost = match[3];
      debugPort = match[4];
    }

    if (debugOption && debugPort !== '0') {
      return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
    }
    return arg;
  });
}

/**
 * @param {Command} startCommand
 * @returns {Command[]}
 * @api private
 */

function getCommandAndParents(startCommand) {
  const result = [];
  for (let command = startCommand; command; command = command.parent) {
    result.push(command);
  }
  return result;
}

exports.Command = Command;


/***/ }),

/***/ 625:
/***/ ((__unused_webpack_module, exports) => {

// @ts-check

/**
 * CommanderError class
 * @class
 */
class CommanderError extends Error {
  /**
   * Constructs the CommanderError class
   * @param {number} exitCode suggested exit code which could be used with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @constructor
   */
  constructor(exitCode, code, message) {
    super(message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.nestedError = undefined;
  }
}

/**
 * InvalidArgumentError class
 * @class
 */
class InvalidArgumentError extends CommanderError {
  /**
   * Constructs the InvalidArgumentError class
   * @param {string} [message] explanation of why argument is invalid
   * @constructor
   */
  constructor(message) {
    super(1, 'commander.invalidArgument', message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

exports.CommanderError = CommanderError;
exports.InvalidArgumentError = InvalidArgumentError;


/***/ }),

/***/ 153:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const { humanReadableArgName } = __nccwpck_require__(414);

/**
 * TypeScript import types for JSDoc, used by Visual Studio Code IntelliSense and `npm run typescript-checkJS`
 * https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 * @typedef { import("./argument.js").Argument } Argument
 * @typedef { import("./command.js").Command } Command
 * @typedef { import("./option.js").Option } Option
 */

// @ts-check

// Although this is a class, methods are static in style to allow override using subclass or just functions.
class Help {
  constructor() {
    this.helpWidth = undefined;
    this.sortSubcommands = false;
    this.sortOptions = false;
    this.showGlobalOptions = false;
  }

  /**
   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
   *
   * @param {Command} cmd
   * @returns {Command[]}
   */

  visibleCommands(cmd) {
    const visibleCommands = cmd.commands.filter(cmd => !cmd._hidden);
    if (cmd._hasImplicitHelpCommand()) {
      // Create a command matching the implicit help command.
      const [, helpName, helpArgs] = cmd._helpCommandnameAndArgs.match(/([^ ]+) *(.*)/);
      const helpCommand = cmd.createCommand(helpName)
        .helpOption(false);
      helpCommand.description(cmd._helpCommandDescription);
      if (helpArgs) helpCommand.arguments(helpArgs);
      visibleCommands.push(helpCommand);
    }
    if (this.sortSubcommands) {
      visibleCommands.sort((a, b) => {
        // @ts-ignore: overloaded return type
        return a.name().localeCompare(b.name());
      });
    }
    return visibleCommands;
  }

  /**
   * Compare options for sort.
   *
   * @param {Option} a
   * @param {Option} b
   * @returns number
   */
  compareOptions(a, b) {
    const getSortKey = (option) => {
      // WYSIWYG for order displayed in help. Short used for comparison if present. No special handling for negated.
      return option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  }

  /**
   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */

  visibleOptions(cmd) {
    const visibleOptions = cmd.options.filter((option) => !option.hidden);
    // Implicit help
    const showShortHelpFlag = cmd._hasHelpOption && cmd._helpShortFlag && !cmd._findOption(cmd._helpShortFlag);
    const showLongHelpFlag = cmd._hasHelpOption && !cmd._findOption(cmd._helpLongFlag);
    if (showShortHelpFlag || showLongHelpFlag) {
      let helpOption;
      if (!showShortHelpFlag) {
        helpOption = cmd.createOption(cmd._helpLongFlag, cmd._helpDescription);
      } else if (!showLongHelpFlag) {
        helpOption = cmd.createOption(cmd._helpShortFlag, cmd._helpDescription);
      } else {
        helpOption = cmd.createOption(cmd._helpFlags, cmd._helpDescription);
      }
      visibleOptions.push(helpOption);
    }
    if (this.sortOptions) {
      visibleOptions.sort(this.compareOptions);
    }
    return visibleOptions;
  }

  /**
   * Get an array of the visible global options. (Not including help.)
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */

  visibleGlobalOptions(cmd) {
    if (!this.showGlobalOptions) return [];

    const globalOptions = [];
    for (let parentCmd = cmd.parent; parentCmd; parentCmd = parentCmd.parent) {
      const visibleOptions = parentCmd.options.filter((option) => !option.hidden);
      globalOptions.push(...visibleOptions);
    }
    if (this.sortOptions) {
      globalOptions.sort(this.compareOptions);
    }
    return globalOptions;
  }

  /**
   * Get an array of the arguments if any have a description.
   *
   * @param {Command} cmd
   * @returns {Argument[]}
   */

  visibleArguments(cmd) {
    // Side effect! Apply the legacy descriptions before the arguments are displayed.
    if (cmd._argsDescription) {
      cmd._args.forEach(argument => {
        argument.description = argument.description || cmd._argsDescription[argument.name()] || '';
      });
    }

    // If there are any arguments with a description then return all the arguments.
    if (cmd._args.find(argument => argument.description)) {
      return cmd._args;
    }
    return [];
  }

  /**
   * Get the command term to show in the list of subcommands.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  subcommandTerm(cmd) {
    // Legacy. Ignores custom usage string, and nested commands.
    const args = cmd._args.map(arg => humanReadableArgName(arg)).join(' ');
    return cmd._name +
      (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
      (cmd.options.length ? ' [options]' : '') + // simplistic check for non-help option
      (args ? ' ' + args : '');
  }

  /**
   * Get the option term to show in the list of options.
   *
   * @param {Option} option
   * @returns {string}
   */

  optionTerm(option) {
    return option.flags;
  }

  /**
   * Get the argument term to show in the list of arguments.
   *
   * @param {Argument} argument
   * @returns {string}
   */

  argumentTerm(argument) {
    return argument.name();
  }

  /**
   * Get the longest command term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestSubcommandTermLength(cmd, helper) {
    return helper.visibleCommands(cmd).reduce((max, command) => {
      return Math.max(max, helper.subcommandTerm(command).length);
    }, 0);
  }

  /**
   * Get the longest option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestOptionTermLength(cmd, helper) {
    return helper.visibleOptions(cmd).reduce((max, option) => {
      return Math.max(max, helper.optionTerm(option).length);
    }, 0);
  }

  /**
   * Get the longest global option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestGlobalOptionTermLength(cmd, helper) {
    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
      return Math.max(max, helper.optionTerm(option).length);
    }, 0);
  }

  /**
   * Get the longest argument term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  longestArgumentTermLength(cmd, helper) {
    return helper.visibleArguments(cmd).reduce((max, argument) => {
      return Math.max(max, helper.argumentTerm(argument).length);
    }, 0);
  }

  /**
   * Get the command usage to be displayed at the top of the built-in help.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  commandUsage(cmd) {
    // Usage
    let cmdName = cmd._name;
    if (cmd._aliases[0]) {
      cmdName = cmdName + '|' + cmd._aliases[0];
    }
    let parentCmdNames = '';
    for (let parentCmd = cmd.parent; parentCmd; parentCmd = parentCmd.parent) {
      parentCmdNames = parentCmd.name() + ' ' + parentCmdNames;
    }
    return parentCmdNames + cmdName + ' ' + cmd.usage();
  }

  /**
   * Get the description for the command.
   *
   * @param {Command} cmd
   * @returns {string}
   */

  commandDescription(cmd) {
    // @ts-ignore: overloaded return type
    return cmd.description();
  }

  /**
   * Get the subcommand summary to show in the list of subcommands.
   * (Fallback to description for backwards compatibility.)
   *
   * @param {Command} cmd
   * @returns {string}
   */

  subcommandDescription(cmd) {
    // @ts-ignore: overloaded return type
    return cmd.summary() || cmd.description();
  }

  /**
   * Get the option description to show in the list of options.
   *
   * @param {Option} option
   * @return {string}
   */

  optionDescription(option) {
    const extraInfo = [];

    if (option.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
    }
    if (option.defaultValue !== undefined) {
      // default for boolean and negated more for programmer than end user,
      // but show true/false for boolean option as may be for hand-rolled env or config processing.
      const showDefault = option.required || option.optional ||
        (option.isBoolean() && typeof option.defaultValue === 'boolean');
      if (showDefault) {
        extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
      }
    }
    // preset for boolean and negated are more for programmer than end user
    if (option.presetArg !== undefined && option.optional) {
      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== undefined) {
      extraInfo.push(`env: ${option.envVar}`);
    }
    if (extraInfo.length > 0) {
      return `${option.description} (${extraInfo.join(', ')})`;
    }

    return option.description;
  }

  /**
   * Get the argument description to show in the list of arguments.
   *
   * @param {Argument} argument
   * @return {string}
   */

  argumentDescription(argument) {
    const extraInfo = [];
    if (argument.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`);
    }
    if (argument.defaultValue !== undefined) {
      extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
    }
    if (extraInfo.length > 0) {
      const extraDescripton = `(${extraInfo.join(', ')})`;
      if (argument.description) {
        return `${argument.description} ${extraDescripton}`;
      }
      return extraDescripton;
    }
    return argument.description;
  }

  /**
   * Generate the built-in help text.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {string}
   */

  formatHelp(cmd, helper) {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth || 80;
    const itemIndentWidth = 2;
    const itemSeparatorWidth = 2; // between term and description
    function formatItem(term, description) {
      if (description) {
        const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
        return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
      }
      return term;
    }
    function formatList(textArray) {
      return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth));
    }

    // Usage
    let output = [`Usage: ${helper.commandUsage(cmd)}`, ''];

    // Description
    const commandDescription = helper.commandDescription(cmd);
    if (commandDescription.length > 0) {
      output = output.concat([helper.wrap(commandDescription, helpWidth, 0), '']);
    }

    // Arguments
    const argumentList = helper.visibleArguments(cmd).map((argument) => {
      return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
    });
    if (argumentList.length > 0) {
      output = output.concat(['Arguments:', formatList(argumentList), '']);
    }

    // Options
    const optionList = helper.visibleOptions(cmd).map((option) => {
      return formatItem(helper.optionTerm(option), helper.optionDescription(option));
    });
    if (optionList.length > 0) {
      output = output.concat(['Options:', formatList(optionList), '']);
    }

    if (this.showGlobalOptions) {
      const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (globalOptionList.length > 0) {
        output = output.concat(['Global Options:', formatList(globalOptionList), '']);
      }
    }

    // Commands
    const commandList = helper.visibleCommands(cmd).map((cmd) => {
      return formatItem(helper.subcommandTerm(cmd), helper.subcommandDescription(cmd));
    });
    if (commandList.length > 0) {
      output = output.concat(['Commands:', formatList(commandList), '']);
    }

    return output.join('\n');
  }

  /**
   * Calculate the pad width from the maximum term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */

  padWidth(cmd, helper) {
    return Math.max(
      helper.longestOptionTermLength(cmd, helper),
      helper.longestGlobalOptionTermLength(cmd, helper),
      helper.longestSubcommandTermLength(cmd, helper),
      helper.longestArgumentTermLength(cmd, helper)
    );
  }

  /**
   * Wrap the given string to width characters per line, with lines after the first indented.
   * Do not wrap if insufficient room for wrapping (minColumnWidth), or string is manually formatted.
   *
   * @param {string} str
   * @param {number} width
   * @param {number} indent
   * @param {number} [minColumnWidth=40]
   * @return {string}
   *
   */

  wrap(str, width, indent, minColumnWidth = 40) {
    // Full \s characters, minus the linefeeds.
    const indents = ' \\f\\t\\v\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff';
    // Detect manually wrapped and indented strings by searching for line break followed by spaces.
    const manualIndent = new RegExp(`[\\n][${indents}]+`);
    if (str.match(manualIndent)) return str;
    // Do not wrap if not enough room for a wrapped column of text (as could end up with a word per line).
    const columnWidth = width - indent;
    if (columnWidth < minColumnWidth) return str;

    const leadingStr = str.slice(0, indent);
    const columnText = str.slice(indent).replace('\r\n', '\n');
    const indentString = ' '.repeat(indent);
    const zeroWidthSpace = '\u200B';
    const breaks = `\\s${zeroWidthSpace}`;
    // Match line end (so empty lines don't collapse),
    // or as much text as will fit in column, or excess text up to first break.
    const regex = new RegExp(`\n|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`, 'g');
    const lines = columnText.match(regex) || [];
    return leadingStr + lines.map((line, i) => {
      if (line === '\n') return ''; // preserve empty lines
      return ((i > 0) ? indentString : '') + line.trimEnd();
    }).join('\n');
  }
}

exports.Help = Help;


/***/ }),

/***/ 558:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const { InvalidArgumentError } = __nccwpck_require__(625);

// @ts-check

class Option {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */

  constructor(flags, description) {
    this.flags = flags;
    this.description = description || '';

    this.required = flags.includes('<'); // A value must be supplied when the option is specified.
    this.optional = flags.includes('['); // A value is optional when the option is specified.
    // variadic test ignores <value,...> et al which might be used to describe custom splitting of single argument
    this.variadic = /\w\.\.\.[>\]]$/.test(flags); // The option can take multiple values.
    this.mandatory = false; // The option must have a value after parsing, which usually means it must be specified on command line.
    const optionFlags = splitOptionFlags(flags);
    this.short = optionFlags.shortFlag;
    this.long = optionFlags.longFlag;
    this.negate = false;
    if (this.long) {
      this.negate = this.long.startsWith('--no-');
    }
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.presetArg = undefined;
    this.envVar = undefined;
    this.parseArg = undefined;
    this.hidden = false;
    this.argChoices = undefined;
    this.conflictsWith = [];
    this.implied = undefined;
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {any} value
   * @param {string} [description]
   * @return {Option}
   */

  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Preset to use when option used without option-argument, especially optional but also boolean and negated.
   * The custom processing (parseArg) is called.
   *
   * @example
   * new Option('--color').default('GREYSCALE').preset('RGB');
   * new Option('--donate [amount]').preset('20').argParser(parseFloat);
   *
   * @param {any} arg
   * @return {Option}
   */

  preset(arg) {
    this.presetArg = arg;
    return this;
  }

  /**
   * Add option name(s) that conflict with this option.
   * An error will be displayed if conflicting options are found during parsing.
   *
   * @example
   * new Option('--rgb').conflicts('cmyk');
   * new Option('--js').conflicts(['ts', 'jsx']);
   *
   * @param {string | string[]} names
   * @return {Option}
   */

  conflicts(names) {
    this.conflictsWith = this.conflictsWith.concat(names);
    return this;
  }

  /**
   * Specify implied option values for when this option is set and the implied options are not.
   *
   * The custom processing (parseArg) is not called on the implied values.
   *
   * @example
   * program
   *   .addOption(new Option('--log', 'write logging information to file'))
   *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
   *
   * @param {Object} impliedOptionValues
   * @return {Option}
   */
  implies(impliedOptionValues) {
    let newImplied = impliedOptionValues;
    if (typeof impliedOptionValues === 'string') {
      // string is not documented, but easy mistake and we can do what user probably intended.
      newImplied = { [impliedOptionValues]: true };
    }
    this.implied = Object.assign(this.implied || {}, newImplied);
    return this;
  }

  /**
   * Set environment variable to check for option value.
   *
   * An environment variable is only used if when processed the current option value is
   * undefined, or the source of the current value is 'default' or 'config' or 'env'.
   *
   * @param {string} name
   * @return {Option}
   */

  env(name) {
    this.envVar = name;
    return this;
  }

  /**
   * Set the custom handler for processing CLI option arguments into option values.
   *
   * @param {Function} [fn]
   * @return {Option}
   */

  argParser(fn) {
    this.parseArg = fn;
    return this;
  }

  /**
   * Whether the option is mandatory and must have a value after parsing.
   *
   * @param {boolean} [mandatory=true]
   * @return {Option}
   */

  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }

  /**
   * Hide option in help.
   *
   * @param {boolean} [hide=true]
   * @return {Option}
   */

  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }

  /**
   * @api private
   */

  _concatValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    return previous.concat(value);
  }

  /**
   * Only allow option value to be one of choices.
   *
   * @param {string[]} values
   * @return {Option}
   */

  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
      }
      if (this.variadic) {
        return this._concatValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Return option name.
   *
   * @return {string}
   */

  name() {
    if (this.long) {
      return this.long.replace(/^--/, '');
    }
    return this.short.replace(/^-/, '');
  }

  /**
   * Return option name, in a camelcase format that can be used
   * as a object attribute key.
   *
   * @return {string}
   * @api private
   */

  attributeName() {
    return camelcase(this.name().replace(/^no-/, ''));
  }

  /**
   * Check if `arg` matches the short or long flag.
   *
   * @param {string} arg
   * @return {boolean}
   * @api private
   */

  is(arg) {
    return this.short === arg || this.long === arg;
  }

  /**
   * Return whether a boolean option.
   *
   * Options are one of boolean, negated, required argument, or optional argument.
   *
   * @return {boolean}
   * @api private
   */

  isBoolean() {
    return !this.required && !this.optional && !this.negate;
  }
}

/**
 * This class is to make it easier to work with dual options, without changing the existing
 * implementation. We support separate dual options for separate positive and negative options,
 * like `--build` and `--no-build`, which share a single option value. This works nicely for some
 * use cases, but is tricky for others where we want separate behaviours despite
 * the single shared option value.
 */
class DualOptions {
  /**
   * @param {Option[]} options
   */
  constructor(options) {
    this.positiveOptions = new Map();
    this.negativeOptions = new Map();
    this.dualOptions = new Set();
    options.forEach(option => {
      if (option.negate) {
        this.negativeOptions.set(option.attributeName(), option);
      } else {
        this.positiveOptions.set(option.attributeName(), option);
      }
    });
    this.negativeOptions.forEach((value, key) => {
      if (this.positiveOptions.has(key)) {
        this.dualOptions.add(key);
      }
    });
  }

  /**
   * Did the value come from the option, and not from possible matching dual option?
   *
   * @param {any} value
   * @param {Option} option
   * @returns {boolean}
   */
  valueFromOption(value, option) {
    const optionKey = option.attributeName();
    if (!this.dualOptions.has(optionKey)) return true;

    // Use the value to deduce if (probably) came from the option.
    const preset = this.negativeOptions.get(optionKey).presetArg;
    const negativeValue = (preset !== undefined) ? preset : false;
    return option.negate === (negativeValue === value);
  }
}

/**
 * Convert string from kebab-case to camelCase.
 *
 * @param {string} str
 * @return {string}
 * @api private
 */

function camelcase(str) {
  return str.split('-').reduce((str, word) => {
    return str + word[0].toUpperCase() + word.slice(1);
  });
}

/**
 * Split the short and long flag out of something like '-m,--mixed <value>'
 *
 * @api private
 */

function splitOptionFlags(flags) {
  let shortFlag;
  let longFlag;
  // Use original very loose parsing to maintain backwards compatibility for now,
  // which allowed for example unintended `-sw, --short-word` [sic].
  const flagParts = flags.split(/[ |,]+/);
  if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) shortFlag = flagParts.shift();
  longFlag = flagParts.shift();
  // Add support for lone short flag without significantly changing parsing!
  if (!shortFlag && /^-[^-]$/.test(longFlag)) {
    shortFlag = longFlag;
    longFlag = undefined;
  }
  return { shortFlag, longFlag };
}

exports.Option = Option;
exports.splitOptionFlags = splitOptionFlags;
exports.DualOptions = DualOptions;


/***/ }),

/***/ 592:
/***/ ((__unused_webpack_module, exports) => {

const maxDistance = 3;

function editDistance(a, b) {
  // https://en.wikipedia.org/wiki/Damerau–Levenshtein_distance
  // Calculating optimal string alignment distance, no substring is edited more than once.
  // (Simple implementation.)

  // Quick early exit, return worst case.
  if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);

  // distance between prefix substrings of a and b
  const d = [];

  // pure deletions turn a into empty string
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  // pure insertions turn empty string into b
  for (let j = 0; j <= b.length; j++) {
    d[0][j] = j;
  }

  // fill matrix
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      let cost = 1;
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
      } else {
        cost = 1;
      }
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[a.length][b.length];
}

/**
 * Find close matches, restricted to same number of edits.
 *
 * @param {string} word
 * @param {string[]} candidates
 * @returns {string}
 */

function suggestSimilar(word, candidates) {
  if (!candidates || candidates.length === 0) return '';
  // remove possible duplicates
  candidates = Array.from(new Set(candidates));

  const searchingOptions = word.startsWith('--');
  if (searchingOptions) {
    word = word.slice(2);
    candidates = candidates.map(candidate => candidate.slice(2));
  }

  let similar = [];
  let bestDistance = maxDistance;
  const minSimilarity = 0.4;
  candidates.forEach((candidate) => {
    if (candidate.length <= 1) return; // no one character guesses

    const distance = editDistance(word, candidate);
    const length = Math.max(word.length, candidate.length);
    const similarity = (length - distance) / length;
    if (similarity > minSimilarity) {
      if (distance < bestDistance) {
        // better edit distance, throw away previous worse matches
        bestDistance = distance;
        similar = [candidate];
      } else if (distance === bestDistance) {
        similar.push(candidate);
      }
    }
  });

  similar.sort((a, b) => a.localeCompare(b));
  if (searchingOptions) {
    similar = similar.map(candidate => `--${candidate}`);
  }

  if (similar.length > 1) {
    return `\n(Did you mean one of ${similar.join(', ')}?)`;
  }
  if (similar.length === 1) {
    return `\n(Did you mean ${similar[0]}?)`;
  }
  return '';
}

exports.suggestSimilar = suggestSimilar;


/***/ }),

/***/ 598:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"doge-ts","version":"1.0.0","description":"","main":"dist/index.js","scripts":{"build":"tsc","test":"echo \\"Error: no test specified\\" && exit 1","package":"npm run build && ncc build --source-map --license licenses.txt"},"keywords":[],"author":"Carlos Gonzalez <carlos.gonzalez@with-madrid.com>","license":"ISC","dependencies":{"@actions/core":"^1.10.0","commander":"^11.0.0","figlet":"^1.6.0"},"devDependencies":{"@types/node":"^20.4.4","@vercel/ncc":"^0.36.1","typescript":"^5.1.6"}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

const { Command } = __nccwpck_require__(379); // add this line
const figlet = __nccwpck_require__(405);
const program = new Command();
console.log(figlet.textSync("DogeOps Action"));
/**
 * Retrieve the version of the package from the package.json file
 */
function getPackageVersion() {
    const packageJson = __nccwpck_require__(598);
    return packageJson.version;
}
program
    .version(getPackageVersion())
    .description("A CLI to start a DogeOps deployment")
    .option("-d, --dogefile <path>", "Path to the Dogefile to use")
    .option("-e, --event <name>", "Name of the event that triggered the deployment")
    .option("-r, --repo <path>", "Path to the repository to deploy")
    .option("-f, --ref <ref>", "Git ref to deploy")
    .option("-v, --verbose", "Verbose output")
    .parse(process.argv);
const options = program.opts();
//# sourceMappingURL=index.js.map
})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map