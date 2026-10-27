import { TEINodes } from "react-teirouter"
import { Behavior } from '@/ceteicean/Behavior'
import { useEffect, useRef } from 'react'
import { isTouchInput, selectLink } from '@/helpers/touchSelection'

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
        const meiIds = targets.split(' ').map(target => target.slice(1))
        let dehighlight: (() => void) | undefined

        // pointing with a mouse (or pen) highlights the score elements
        const onPointerOver = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return
            dehighlight = window.highlightRefs(meiIds)
        }

        const onPointerLeave = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return
            if (dehighlight) dehighlight()
        }

        // on touch screens a tap does the same, and also brings the score elements into view
        const onClick = (e: MouseEvent) => {
            if (!isTouchInput()) return
            // links inside the passage, and passages inside this one, handle the tap themselves
            const target = e.target as Element
            if (target.closest('a') || target.closest('.ref') !== el) return
            selectLink([el], meiIds, 'score')
        }

        el.addEventListener('pointerover', onPointerOver)
        el.addEventListener('pointerleave', onPointerLeave)
        el.addEventListener('click', onClick)

        return () => {
            el.removeEventListener('pointerover', onPointerOver)
            el.removeEventListener('pointerleave', onPointerLeave)
            el.removeEventListener('click', onClick)
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
