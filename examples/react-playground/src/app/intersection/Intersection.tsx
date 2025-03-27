import './intersection.css';

import * as React from 'react';
import { useEffect } from 'react';

// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#thresholds

export const Intersection = () => {
  useEffect(() => {
    const observers = [];

    const startup = () => {
      const wrapper = document.querySelector('.wrapper');

      // Options for the observers

      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: [],
      };

      // An array of threshold sets for each of the boxes. The
      // first box's thresholds are set programmatically
      // since there will be so many of them (for each percentage
      // point).

      const thresholdSets = [
        [],
        [0.5],
        [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        [0, 0.25, 0.5, 0.75, 1],
      ];

      for (let i = 0; i <= 1; i += 0.01) {
        thresholdSets[0].push(i);
      }

      // Add each box, creating a new observer for each

      for (let i = 0; i < 4; i++) {
        // let template = document
        //   .querySelector("#boxTemplate")
        //   .content.cloneNode(true);
        const boxID = `box${i + 1}`;
        // template.querySelector(".sampleBox").id = boxID;
        // wrapper.appendChild(document.importNode(template, true));

        // Set up the observer for this box

        observerOptions.threshold = thresholdSets[i];
        observers[i] = new IntersectionObserver2(
          intersectionCallback,
          observerOptions
        );
        observers[i].observe(document.querySelector(`#${boxID}`));
      }

      // Scroll to the starting position

      document.scrollingElement.scrollTop =
        wrapper.firstElementChild.getBoundingClientRect().top + window.scrollY;
      document.scrollingElement.scrollLeft = 750;
    };

    const intersectionCallback = (entries) => {
      entries.forEach((entry) => {
        const box = entry.target;
        const visiblePct = `${Math.floor(entry.intersectionRatio * 100)}%`;

        box.querySelector('.topLeft').textContent = visiblePct;
        box.querySelector('.topRight').textContent = visiblePct;
        box.querySelector('.bottomLeft').textContent = visiblePct;
        box.querySelector('.bottomRight').textContent = visiblePct;
      });
    };

    startup();
  }, []);

  return (
    <React.Fragment>
      <template id="boxTemplate">
        <div className="sampleBox">
          <div className="label topLeft" />
          <div className="label topRight" />
          <div className="label bottomLeft" />
          <div className="label bottomRight" />
        </div>
      </template>

      <main>
        <div className="contents">
          <div className="wrapper">
            {[0, 1, 2, 3].map((key) => {
              return (
                <div className="sampleBox" id={`box${key + 1}`} key={key}>
                  <div className="label topLeft" />
                  <div className="label topRight" />
                  <div className="label bottomLeft" />
                  <div className="label bottomRight" />
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </React.Fragment>
  );
};
