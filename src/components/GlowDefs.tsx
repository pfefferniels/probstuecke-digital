export const GlowDefs = () => {
    return (
        <svg width="0" height="0">
            <defs>
                <filter id="softGlow" height="300%" width="300%" x="-75%" y="-75%">
                    <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="thicken" />
                    <feGaussianBlur in="thicken" stdDeviation="300" result="blurred" />
                    <feFlood floodColor="#ffc80a" result="glowColor" />
                    <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored" />
                    <feMerge>
                        <feMergeNode in="softGlow_colored" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="highlightGlow" height="300%" width="300%" x="-75%" y="-75%">
                    <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="thicken" />
                    <feGaussianBlur in="thicken" stdDeviation="300" result="blurred" />
                    <feFlood floodColor="red" result="glowColor" />
                    <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored" />
                    <feMerge>
                        <feMergeNode in="softGlow_colored" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    )
}
