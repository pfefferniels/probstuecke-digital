import { TEINodes } from "react-teirouter"
import { Behavior } from '@/ceteicean/Behavior'
import { useEffect, useRef } from 'react'

interface RefProps {
    teiNode: Node
}

export const Ref = (props: RefProps) => {
    const targets = (props.teiNode as Element).getAttribute('target')

    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!ref.current) return
        if (!targets) return

        const el = ref.current
        let dehighlight: (() => void) | undefined

        const onMouseOver = () => {
            dehighlight = window.highlightRefs(targets.split(' ').map(target => target.slice(1)))
        }

        const onMouseLeave = () => {
            if (dehighlight) dehighlight()
        }

        el.addEventListener('mouseover', onMouseOver)
        el.addEventListener('mouseleave', onMouseLeave)

        return () => {
            el.removeEventListener('mouseover', onMouseOver)
            el.removeEventListener('mouseleave', onMouseLeave)
        }
    })

    return (
        <Behavior node={props.teiNode}>
            <span
                ref={ref}
                data-target={targets}
                className='ref'>
                {<TEINodes
                    teiNodes={props.teiNode.childNodes}
                    {...props} />}
            </span>
        </Behavior>
    )
}
