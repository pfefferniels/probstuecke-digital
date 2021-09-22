import React, { useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import mirador from 'mirador'
import { apiUrl } from '../config'
import './MiradorModal.scss'

const MiradorModal = ({
  show,
  onHide,
  piece
}) => {
  useEffect(() => {
    if (!show) return

    // prepare Mirador
    const config = {
      id: 'mirador',
      window: {
        defaultView: 'single',
        views: [
          { key: 'single' },
          { key: 'book' },
          { key: 'scroll' }
        ]
      },
      windows: []
    }

    const instance = mirador.viewer(config, [])

    // load manifest
    const loadManifest = async () => {
      try {
        const response = await fetch(`${apiUrl}/manifest?path=${piece}/mattheson/score.xml`)
        const data = await response.json()
        if (!data) {
          console.log('something went wrong')
          return
        }

        data.map((facsimile) => {
          // add manifest to Mirador
          let addWindow = mirador.actions.addWindow({
            defaultView: 'single',
            id: `window-${Date.now()}`,
            manifestId: facsimile.manifest,
            canvasId: facsimile.canvas
          })
          instance.store.dispatch(addWindow)
        })

      } catch (e) {
        console.log(e)
      }
    }

    loadManifest()
  }, [show])


  return (
    <div
      className='overlayBackground'
      style={{
        display: show ? 'flex' : 'none'
      }}>
        <div className='overlayBox'>
          <div id='mirador' />

          <Button
            style={{
              float: 'right',
              marginTop: '0.5rem'
            }}
            onClick={onHide}>Close</Button>
        </div>
    </div>
  )
}

export default MiradorModal
