import { define, html } from "hybrids"

define({
	tag: 'seg-curtain',
	render: () => html`<slot></slot>`.css`
		:host {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			background: var(--seg-curtain-background, #00000030);
			pointer-events: none;
		}
	`
})