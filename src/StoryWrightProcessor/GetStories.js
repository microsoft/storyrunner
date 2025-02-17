// @ts-check

/**
    * @typedef {{
                argTypeTargetsV7:boolean;
                buildStoriesJson:boolean;
                disallowImplicitActionsInRenderV8: boolean;
                legacyDecoratorFileOrder: boolean;
                storyStoreV7?: boolean;
                warnOnLegacyHierarchySeparator: boolean
            }} SbFeatures
*/

getStoriesWithSteps();

function getStoriesWithSteps() {
  /**
   * @type {SbFeatures}
   */
  const storybookFeatures = window["FEATURES"];

  return getPageStories(storybookFeatures).then((stories) => {
    /**
     * @type {typeof stories}
     */
    const storiesWithSteps = [];
    /**
     * @type {string[]} story ids that failed while processing storyFn
     */
    const errors = [];
    for (let story of stories) {
      try {
        if (typeof story.storyFn === "function") {
          let res = story.storyFn();
          let steps = findSteps(res);
          if (steps !== "undefined" && steps !== null) {
            story.steps = steps;
          }
        }
      } catch (ex) {
        errors.push(story["id"]);
        console.error("Error processing render() method of: " + story["id"]);
        console.error(ex);
      }

      storiesWithSteps.push(story);
    }

    return { storiesWithSteps, errors };
  });
}

/**
 *
 * @param {Record<string,any>} res
 * @returns
 */
function findSteps(res) {
  if (res.props && res.props.isStowrWrightComponent === true) {
    return res.props.steps;
  }
  if (res.props && res.props.children) {
    let children = res.props.children;
    if (
      typeof children === "object" &&
      typeof children.map === "function" &&
      children.length > 0
    ) {
      for (var i = 0, len = children.length; i < len; i++) {
        let steps = findSteps(children[i]);
        if (steps) return steps;
      }
    } else {
      let steps = findSteps(children);
      return steps;
    }
  }
}

/**
 *
 * @param {SbFeatures} features
 * @returns {Promise<Array<{id:string;[key:string]:unknown}>>}
 */
function getPageStories(features) {
  /**
   * only SB v7 supports this configuration
   */
  const supportsStoryStoreV7config = typeof features.storyStoreV7 === "boolean";
  // NOTE:
  // storyStoreV7:
  //  - is configurable only in SB v7
  //  - is `true` by default SB v7
  //  - doesn't exist in SB v7 (enabled by default)

  // get page stories async obtained from multiple build chunks
  if (!supportsStoryStoreV7config || features.storyStoreV7) {
    return window["__STORYBOOK_CLIENT_API__"].storyStore
      .cacheAllCSFFiles()
      .then(() => {
        return window["__STORYBOOK_CLIENT_API__"].raw() || [];
      });
  }

  return Promise.resolve(window["__STORYBOOK_CLIENT_API__"]?.raw() || []);
}
