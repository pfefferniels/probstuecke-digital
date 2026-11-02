'use client'

import { createContext, useContext } from 'react'

/**
 * How a piece page shows its sources, the text and the music alike: in modern spelling
 * and notation, or diplomatically, as printed (ſ, ͤ, the nasal bar and the spelling of
 * the print, its line breaks; the original clefs and accidentals).
 */
export type View = 'modern' | 'diplomatic'

/**
 * A context rather than props, as the words and scores are drawn by routes that keep
 * the props they were first given (react-teirouter)
 */
export const ViewContext = createContext<View>('modern')

export const useView = () => useContext(ViewContext)
