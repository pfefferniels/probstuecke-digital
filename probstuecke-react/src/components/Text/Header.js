import React from 'react'

const Header = React.forwardRef((props, ref) => (
  <div hidden>
    <div ref={ref} className="teiMetadata">
      {props.children}
    </div>
  </div>
));

export default Header
