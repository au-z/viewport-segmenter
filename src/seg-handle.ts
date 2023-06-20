import { define, svg } from 'hybrids'

define({
  tag: 'seg-handle',
  type: {
    get: (host, val) => val,
    set: (host, val = 'corner') => val.toLowerCase(),
  },
  dim: 15,
  r: 30,
  tr: false,
  br: false,
  bl: false,
  tl: false,
  edge: '',
  rot: ({ tr, br, bl, tl }) => (br ? -270 : tl ? -90 : bl ? -180 : 0),
  render: ({ type, dim, r, rot }) => svg`${
    type === 'corner'
      ? svg`
		<svg viewBox="0 0 275 275" width="${dim}" height="${dim}">
			<g style="fill: ${`var(--fill, black)`}">
				<ellipse cx="25" cy="25" rx="${r}" ry="${r}"></ellipse>
				<ellipse cx="125" cy="25" rx="${r}" ry="${r}"></ellipse>
				<ellipse cx="225" cy="25" rx="${r}" ry="${r}"></ellipse>
				<ellipse cx="125" cy="125" rx="${r}" ry="${r}"></ellipse>
				<ellipse cx="225" cy="125" rx="${r}" ry="${r}"></ellipse>
				<ellipse cx="225" cy="225" rx="${r}" ry="${r}"></ellipse>
			</g>
		</svg>`
      : type === 'edge'
      ? svg`<svg></svg>`
      : ''
  }`.css`
		:host {
			display: inline-block;
			padding: 4px;
		}
		svg {
			transform: rotate(${rot}deg);
		}
	`,
})
