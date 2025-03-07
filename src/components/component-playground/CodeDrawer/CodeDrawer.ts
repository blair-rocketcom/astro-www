import * as DOM from 'project:utils/client/DOM'
import ReflectedElement from 'project:utils/client/ReflectedElement.ts'
import { h, html } from 'project:utils/html.ts'
import { playgroundSvgs } from 'project:utils/component-playground-svg.ts'
/* @ts-ignore */
import styling from './CodeDrawer.css?withtype=style'
/* @ts-ignore */
import highlighting from './hljs.css?raw'
/* @ts-ignore */
import template from './CodeDrawer.html?raw'
import hljs from 'highlight.js'
// import theme from 'highlight.js/styles/a11y-dark.css?raw'

const content = html(template + '<style>' + highlighting + '</style>')


export default class CodeDrawer extends ReflectedElement(
	HTMLElement as typeof CodeDrawerInterface,
	{
		collapsed: {
			defaultValue() {
				return this.defaultCollapsed
			},
			setValue(value) {
				return Boolean(value)
			},
			useAttributes: {
				collapsed() {
					return this.collapsed
				},
			},
		},

		label: {
			defaultValue() {
				return ''
			},
			setValue(value) {
				return value == null ? '' : String(value)
			},
			useAttributes: {
				label() {
					return this.getAttribute('label') || ''
				},
			},
			onValueChange(label) {
				const internals = DOM.withInternals<Internals>(this)

				internals.shadowHeading.replaceChildren(label)
			},
		},

		code: {
			defaultValue() {
				return this.defaultCode
			},
			setValue(value) {
				return value == null ? '' : String(value)
			},
			useAttributes: {
				code() {
					return this.getAttribute('code') || ''
				},
			},
		},

		defaultCode: {
			defaultValue() {
				return this.getAttribute('code') || ''
			},
			setValue(value) {
				return value == null ? '' : String(value)
			},
			useAttributes: {
				code() {
					return this.getAttribute('code') || ''
				},
			},
		},

		defaultCollapsed: {
			defaultValue() {
				return this.getAttribute('collapsed') !== null
			},
			setValue(value) {
				return Boolean(value)
			},
			useAttributes: {
				collapsed() {
					return this.hasAttribute('collapsed')
				},
			},
			onValueChange(value) {
				this.toggleAttribute('collapsed', value)
			},
		},
	}
) {
	constructor() {
		const element: CodeDrawer = super()!

		const shadowRoot = DOM.withShadow(element, {
			mode: 'open',
			content,
			styling,
		})

		// Collapse/Expand Drawer
		const collapseButton = DOM.queryPart<HTMLButtonElement>(shadowRoot, 'collapseButton')!
		collapseButton.appendChild(h(`${playgroundSvgs.collapseIcon}`))
		// trigger a togglePanel event
		DOM.observe(collapseButton, {
			click() {
				element.toggleAttribute('collapsed')

				DOM.trigger(element, {
					togglePanel: { bubbles: true, composed: true },
				})
			}
		})

		const copyButton = DOM.queryPart<HTMLButtonElement>(shadowRoot, 'copyCodeButton')!
		copyButton.appendChild(h(`${playgroundSvgs.copyIcon}`))

		// trigger a togglePanel event
		DOM.observe(copyButton, {
			click() {
				navigator.clipboard.writeText(element.code)
				copyButton.innerHTML = playgroundSvgs.doneIcon
				setTimeout(() => {
					copyButton.innerHTML = playgroundSvgs.copyIcon
				}, 1000)

				DOM.trigger(element, {
					clipboardWrite: { bubbles: true, composed: true },
				})
			}
		})

		const shadowHeading = DOM.queryPart<HTMLSlotElement>(shadowRoot, 'headingTitle')!
		const shadowContent = DOM.queryPart<HTMLSlotElement>(shadowRoot, 'content')!
		const formatForDisplay = (code: string) => {
			const pattern = /[<>]/g
			const replacement: { [key: string]: string; } = { '<': '&lt;', '>': '&gt;' }
			let newCode = code.replace(pattern, function (match) {
				return replacement[match]
			})
			return newCode
		}

		// run this once on load
		shadowContent.innerHTML = formatForDisplay(this.code)
		hljs.highlightElement(shadowContent)

		DOM.withInternals<Internals>(element, () => ({
			shadowHeading,
			shadowContent,
		}))

		this.addEventListener('codeUpdate', () => {
			shadowContent.innerHTML = formatForDisplay(this.code)
			hljs.highlightElement(shadowContent)
		})
	}
}

customElements.define('a-code-drawer', CodeDrawer)

declare class CodeDrawerInterface extends HTMLElement {
	/** String label indicating the meaning of the option. */
	label: string

	/** String representing the code. */
	code: string

	/** String representing the default code. */
	defaultCode: string

	/** Boolean indicating whether the panel is active. */
	collapsed: boolean

	/** Boolean indicating whether the panel is initially active. */
	defaultCollapsed: boolean
}

interface Internals {
	shadowHeading: HTMLSlotElement
	shadowContent: HTMLSlotElement
}
