import { getset } from "@auzmartist/hybrids-helpers";
import { define, Descriptor, dispatch, html, parent, svg } from "hybrids";
import { debounce } from "lodash";
import styles from "./seg-box.css?inline";
import "./seg-curtain.js";
import "./seg-handle.js";

type Disposable = <E>(h: E) => { dispose: Function };
const disposable = <T extends Disposable, E>(
  _disposable: T
): Descriptor<T, E> => ({
  ...getset(undefined),
  connect: (h, key) => {
    h[key] = _disposable(h);
    return h[key].dispose;
  },
});

const frag_arrow = svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22">
  <path fill="#00f" fill-opacity=".514" d="m-7 1024.36h34v34h-34z"/>
  <path fill="#aade87" fill-opacity=".472" d="m-6 1028.36h32v32h-32z"/>
  <path d="m345.44 248.29l-194.29 194.28c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744l171.91-171.91-171.91-171.9c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.29 194.28c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373" transform="matrix(.03541-.00013.00013.03541 2.98 3.02)" fill="#4d4d4d"/>
</svg>`;

function findLeaves(node, leaves = []) {
  if (node.leaf) {
    leaves.push(node);
    return;
  } else if (node.children) {
    node.children.forEach((c) => findLeaves(c, leaves));
  }
  return leaves;
}

const emitPartition = debounce((h) => {
  if (h.save && !h.child) {
    localStorage.setItem(
      `seg-box#${h.name}.template`,
      JSON.stringify(h.layout)
    );
  }
  const detail = findLeaves(h.layout);
  dispatch(h, "seg", { detail });
}, 100);

export const SegBox = define<any>({
  tag: "seg-box",
  name: "0",
  save: false, // if true, saves partitions to local storage
  min: 36, // min box size
  template: {
    // pre-apply templated values
    ...getset({}),
    connect: (h, key) => {
      if (!h.save) return;
      const template = JSON.parse(
        localStorage.getItem(`seg-box#${h.name}.template`) ?? "{}"
      );
      if (Object.keys(template).length) {
        h[key] = template;
      }
    },
    observe: (h, { name, dir, partition }) => {
      if (name) h.name = name;
      if (dir) h.dir = dir;
      if (partition) h._partition = partition;
    },
  },
  dir: "", // 'x' | 'y' the segmentation direction
  _parent: parent((el) => el.tag === "seg-box"), // any direct seg-box parent
  _orientation: ({ _parent }) => _parent?.dir, // the parent seg direction
  _origin: getset({ x: 0, y: 0 }), // origin click for segmentation
  _partition: getset(undefined), // the {x, y} proposed partition
  _leaf: ({ _partition }) => !_partition,
  _gridCss: {
    get: ({ _partition, dir }) =>
      _partition &&
      `display: grid;
      grid-template-${dir === "x" ? "columns" : "rows"}: ${
        _partition[dir]
      }px auto 1fr;
      grid-gap: var(--grid-gap, 0.25rem);`,
    observe: emitPartition,
  },
  _merging: getset(false), // merging child _partitions
  segmenter: disposable(Segmenter),
  resizer: disposable(Resizer),
  _children: ({ render }) => [...render().querySelectorAll("seg-box")], // any child partitions
  layout: ({ name, dir, _leaf, _partition, _children }) => {
    const layout: any = { name, dir, leaf: _leaf };
    if (_partition) layout.partition = _partition;
    if (_children) layout.children = _children.map((c) => c.layout);
    return layout;
  },
  onseg: () => (h, e) => {
    e.stopPropagation();
    emitPartition(h);
  },
  // internal use only
  child: false,
  shadow: false,
  // prettier-ignore
  render: (h) => html`
    <div class="${{ box: true, leaf: !h._gridCss }}">
      ${!h._gridCss ? html`
            <seg-handle r="30" dim="10" onmousedown="${h.segmenter.mousedown}"></seg-handle>
            ${h.shadow &&
            html`<seg-curtain>
              <div class="icon-merge ${h._orientation}">${frag_arrow}</div>
            </seg-curtain>`}
            <pre><code><b>${h.name}</b></code></pre>
            <slot name="${h.name}"></slot>
            <slot></slot>
          ` : html`
            ${h.dir === 'x'
              ? html`
                  <seg-box name="${`${h.name}.0`}" child template="${h.template?.children?.[0]}" onseg="${h.onseg}">
                    <slot></slot>
                    <slot name="${`${h.name}.0`}" slot="${`${h.name}.0`}"></slot>
                    <slot name="${`${h.name}.0.0`}" slot="${`${h.name}.0.0`}"></slot>
                    <slot name="${`${h.name}.0.1`}" slot="${`${h.name}.0.1`}"></slot>
                  </seg-box>
                  <div class="resizer ${h.dir}" onmousedown="${h.resizer.mousedown}"><i class="pill ${h.dir}"></i></div>
                  <seg-box
                    name="${`${h.name}.1`}"
                    child
                    template="${h.template?.children?.[1]}"
                    shadow="${h._merging}"
                    onseg="${h.onseg}"
                  >
                    <slot></slot>
                    <slot name="${`${h.name}.1`}" slot="${`${h.name}.1`}"></slot>
                    <slot name="${`${h.name}.1.0`}" slot="${`${h.name}.1.0`}"></slot>
                    <slot name="${`${h.name}.1.1`}" slot="${`${h.name}.1.1`}"></slot>
                  </seg-box>
                `
              : html`
                  <seg-box
                    name="${`${h.name}.0`}"
                    child
                    template="${h.template?.children?.[1]}"
                    shadow="${h._merging}"
                    onseg="${h.onseg}"
                  >
                    <slot></slot>
                    <slot name="${`${h.name}.0`}" slot="${`${h.name}.0`}"></slot>
                    <slot name="${`${h.name}.0.0`}" slot="${`${h.name}.0.0`}"></slot>
                    <slot name="${`${h.name}.0.1`}" slot="${`${h.name}.0.1`}"></slot>
                  </seg-box>
                  <div class="resizer ${h.dir}" onmousedown="${h.resizer.mousedown}"><i class="pill ${h.dir}"></i></div>
                  <seg-box name="${`${h.name}.1`}" child template="${h.template?.children?.[0]}" onseg="${h.onseg}">
                    <slot></slot>
                    <slot name="${`${h.name}.1`}" slot="${`${h.name}.1`}"></slot>
                    <slot name="${`${h.name}.1.0`}" slot="${`${h.name}.1.0`}"></slot>
                    <slot name="${`${h.name}.1.1`}" slot="${`${h.name}.1.1`}"></slot>
                  </seg-box>
                `}
          `}
    </div>`.css`
    .box {
      display: block;
      position: relative;
      ${h._gridCss}
    }
    .resizer > .pill {
      width: ${h.min}px;
    }
    seg-handle {
      --fill: var(--handle-fill, white);
    }
  `.style(styles),
});

function Segmenter(h, slop = 5) {
  function mousedown(h, e) {
    const { x, y } = localMousePos(h, e, true);
    h._origin = { x, y };
    window.addEventListener("mousemove", onSeg);
    window.addEventListener("touchmove", onSeg);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("touchcancel", mouseup);
    window.addEventListener("touchend", mouseup);
  }
  function mouseup(e) {
    dispose();
    if (Math.abs(h._origin?.[h.dir] - h._partition?.[h.dir]) < h.min) {
      h._partition = undefined;
    }
    if (h._parent?._merging) {
      h._parent._partition = undefined;
      h._parent._merging = false;
      h._parent.dir = "";
      emitPartition(h._parent);
    }
    h._origin = null;
  }
  function onSeg(e) {
    if (!h._origin) return;
    const { x, y } = localMousePos(h, e, true);
    const dx = h._origin.x - x;
    const dy = h._origin.y - y;

    h.dir = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (h._parent) {
      const [inside, inside_Parent] = mouseInBounds(e, h, h._parent);
      h._parent._merging = !inside && inside_Parent;
    }
    h._partition = h._parent?._merging ? undefined : { x, y };
  }
  function dispose() {
    window.removeEventListener("mousemove", onSeg);
    window.removeEventListener("touchmove", onSeg);
    window.removeEventListener("mouseup", mouseup);
    window.removeEventListener("touchcancel", mouseup);
    window.removeEventListener("touchend", mouseup);
  }

  return {
    mousedown,
    mouseup,
    dispose,
  };
}

function Resizer(h) {
  function onEdge(e) {
    const { x, y } = localMousePos(h, e, true);
    if (h.dir === "x") {
      h._partition = { x, y: 0 };
    } else if (h.dir === "y") {
      h._partition = { x: 0, y: y };
    }
  }
  function mousedown(h, e) {
    window.addEventListener("mousemove", onEdge);
    window.addEventListener("touchmove", onEdge);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("touchend", mouseup);
    window.addEventListener("touchcancel", mouseup);
  }
  function mouseup(e) {
    dispose();
    h.segmenter.mouseup(e); // apply the partition
  }
  function dispose() {
    window.removeEventListener("mousemove", onEdge);
    window.removeEventListener("touchmove", onEdge);
    window.removeEventListener("mouseup", mouseup);
    window.removeEventListener("touchend", mouseup);
    window.removeEventListener("touchcancel", mouseup);
  }
  return {
    mousedown,
    dispose,
  };
}

function localMousePos(h, e, clamp = false) {
  const bbox = h.getBoundingClientRect();
  const x = e.clientX - bbox.x;
  const y = e.clientY - bbox.y;
  const clampX = Math.floor(Math.max(0, Math.min(bbox.width, x)));
  const clampY = Math.floor(Math.max(0, Math.min(bbox.height, y)));
  return { x: clamp ? clampX : x, y: clamp ? clampY : y };
}

function mouseInBounds(e: MouseEvent, ...els: HTMLElement[]) {
  return els.map((el) => {
    const { x, y, width, height } = el.getBoundingClientRect();
    return (
      x < e.clientX &&
      e.clientX < x + width &&
      y < e.clientY &&
      e.clientY < y + height
    );
  });
}
