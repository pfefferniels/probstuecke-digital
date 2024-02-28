import { TEINodes } from "react-teirouter"
import { Behavior } from "gatsby-theme-ceteicean/src/components//Behavior"
import React, { useEffect, useRef } from 'react'

interface RefProps {
    teiNode: Node
}

export const Ref = (props: RefProps) => {
    const targets = (props.teiNode as Element).getAttribute('target')

    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!ref.current) return 
        if (!targets) return 

        let dehighlight: () => void

        ref.current.addEventListener('mouseover', () => {
            dehighlight = window.highlightRefs(targets.split(' ').map(target => target.slice(1)))
        })

        ref.current.addEventListener('mouseleave', () => {
            if (dehighlight) dehighlight()
        })
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