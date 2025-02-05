// @ts-check

/**
    * @typedef {{
                argTypeTargetsV7:boolean;
                buildStoriesJson:boolean;
                disallowImplicitActionsInRenderV8: boolean;
                legacyDecoratorFileOrder: boolean;
                storyStoreV7: boolean;
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
    let ret = [];
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
        console.error("Error processing render() method of:", story["id"]);
        console.error(ex);
      }
      ret.push(story);
    }

    return ret;
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
 * @returns {Promise<Array<Record<string,unknown>>>}
 */
function getPageStories(features) {
  // NOTE: if storyStoreV7 is enabled ( default SB v7 ) api to get page stories is different and needs to be executed in 2 steps
  if (features.storyStoreV7) {
    return window["__STORYBOOK_CLIENT_API__"].storyStore
      .cacheAllCSFFiles()
      .then(() => {
        return window["__STORYBOOK_CLIENT_API__"].raw() || [];
      });
  }

  return Promise.resolve(window["__STORYBOOK_CLIENT_API__"]?.raw() || []);
}
