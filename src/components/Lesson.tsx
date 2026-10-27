'use client'

import { useId, type ReactNode } from 'react'
import { TEINodes } from 'react-teirouter'
import PianoOutlined from '@mui/icons-material/PianoOutlined'
import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined'
import { joinNames } from '@/lib/citation'
import type { ExpressionMedia, Participant } from '@/lib/types'

/**
 * The parts of a text that only the lessons and realisations have: the turns of
 * a spoken lesson (<u>), what is done in it (<kinesic>, <incident>, <vocal>), the
 * transcriptions and recordings of what is played (ptr[@type="transcription"],
 * ptr[@type="audio"]) and the recordings of realisations (<media>).
 */

interface RouteProps {
    teiNode: Element
    availableRoutes?: string[]
}

interface LessonContext {
    participants: Participant[]
    media: ExpressionMedia[]
    /** draws the music that a ptr[@type="transcription"] points to */
    renderMusic: (ptr: Element) => ReactNode
}

const tagName = (node: Node) =>
    node.nodeType === 1 ? (node as Element).tagName.toLowerCase() : null

const isPtr = (type: string) => (node: Node): node is Element =>
    tagName(node) === 'tei-ptr' && (node as Element).getAttribute('type') === type

/** The names of the participants that @who points to */
const namesOf = (who: string | null, participants: Participant[]) =>
    (who || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(token => {
            const id = token.replace(/^#/, '')
            return participants.find(participant => participant.xmlId === id)?.name || id
        })

const formats: Record<string, string> = {
    'audio/ogg': 'Ogg',
    'audio/mpeg': 'MP3',
    'audio/mp4': 'AAC',
    'audio/wav': 'WAV',
    'audio/flac': 'FLAC',
}

const fileSize = (bytes: number) =>
    bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} kB`

/** Format and size of a recording, e.g. "Ogg, 9.5 MB" */
export const mediaDetails = (media: ExpressionMedia) =>
    [media.mimeType && formats[media.mimeType], media.bytes !== null && fileSize(media.bytes)]
        .filter(Boolean)
        .join(', ')

interface AudioPlayerProps {
    media: ExpressionMedia | undefined
    label?: string
    /** the ID of an element that says what is heard */
    describedBy?: string
}

/** A recording, with the browser's own controls and a link to download it */
const AudioPlayer = ({ media, label = 'Recording', describedBy }: AudioPlayerProps) => {
    const captionId = useId()
    if (!media) return null

    const details = mediaDetails(media)
    return (
        <figure className="audioPlayer" lang="en">
            <figcaption id={captionId}>
                <VolumeUpOutlined className="audioIcon" fontSize="small" aria-hidden />
                {label}
            </figcaption>
            <audio
                controls
                preload="metadata"
                aria-labelledby={[captionId, describedBy].filter(Boolean).join(' ')}
            >
                <source src={media.url} type={media.mimeType || undefined} />
                Your browser cannot play this recording; download it instead.
            </audio>
            <a className="audioDownload" href={media.url} download>
                Download<span className="visuallyHidden"> the recording</span>
                {details && ` (${details})`}
            </a>
        </figure>
    )
}

const findMedia = (media: ExpressionMedia[], target: string | null) =>
    media.find(m => m.target === target)

/** The music a ptr[@type="transcription"] points to; its xml:id can be the target of a ref */
const Transcription = ({ ptr, context }: { ptr: Element, context: LessonContext }) => (
    <div className="transcription" id={ptr.getAttribute('id') || undefined}>
        {context.renderMusic(ptr)}
    </div>
)

/** A turn of the lesson: the speaker, then what is said */
const Utterance = ({ teiNode, availableRoutes, participants }: RouteProps & { participants: Participant[] }) => {
    const speakers = namesOf(teiNode.getAttribute('who'), participants)
    return (
        <div className="utterance">
            {speakers.length > 0 && (
                <span className="speaker">
                    {joinNames(speakers)}:
                </span>
            )}
            <span className="speech">
                <TEINodes teiNodes={teiNode.childNodes} availableRoutes={availableRoutes} />
            </span>
        </div>
    )
}

/**
 * What someone does in the lesson, set off like a stage direction: who does it and
 * the description, then the music and the recording of what is played.
 */
const Action = ({ teiNode, availableRoutes, context }: RouteProps & { context: LessonContext }) => {
    const descId = useId()
    if (teiNode.getAttribute('rend') === 'hidden') return null

    const actors = namesOf(teiNode.getAttribute('who'), context.participants)
    const desc = Array.from(teiNode.childNodes).find(node => tagName(node) === 'tei-desc')
    const nodes = desc ? Array.from(desc.childNodes) : []
    const transcriptions = nodes.filter(isPtr('transcription'))
    const recordings = nodes.filter(isPtr('audio'))
    const description = nodes.filter(node => !isPtr('transcription')(node) && !isPtr('audio')(node))
    const type = teiNode.getAttribute('type')

    return (
        <div className="action" data-type={type || undefined}>
            <div className="actionDesc" id={descId}>
                {type === 'playing' && <PianoOutlined className="actionIcon" fontSize="small" aria-hidden />}
                {actors.length > 0 && <span className="actor">{joinNames(actors)}</span>}
                {' '}
                <TEINodes teiNodes={description} availableRoutes={availableRoutes} />
            </div>
            {transcriptions.map((ptr, i) => (
                <Transcription key={`t${i}`} ptr={ptr} context={context} />
            ))}
            {recordings.map((ptr, i) => (
                <AudioPlayer
                    key={`a${i}`}
                    media={findMedia(context.media, ptr.getAttribute('target'))}
                    describedBy={descId}
                />
            ))}
        </div>
    )
}

/** A ptr outside the description of an action */
const Pointer = ({ teiNode, context }: RouteProps & { context: LessonContext }) => {
    const target = teiNode.getAttribute('target')
    if (isPtr('transcription')(teiNode)) return <Transcription ptr={teiNode} context={context} />
    if (isPtr('audio')(teiNode)) return <AudioPlayer media={findMedia(context.media, target)} />
    return target ? <a href={target}>{target}</a> : null
}

/** The recording of a realisation (<media>); a <desc> in it names it */
const Media = ({ teiNode, context }: RouteProps & { context: LessonContext }) => {
    const desc = Array.from(teiNode.childNodes).find(node => tagName(node) === 'tei-desc')
    return (
        <AudioPlayer
            media={findMedia(context.media, teiNode.getAttribute('url'))}
            label={desc?.textContent?.replace(/\s+/g, ' ').trim() || undefined}
        />
    )
}

/** Something left out of the transcription, e.g. an inaudible passage */
const Gap = ({ teiNode }: RouteProps) => {
    const reason = teiNode.getAttribute('reason')
    return <span className="gap" lang="en">[{reason || '…'}]</span>
}

/** Who takes part in a lesson, e.g. "Teacher: Robert Hill · Student: Niels Pfeffer" */
export const Participants = ({ participants }: { participants: Participant[] }) => (
    <ul className="participants" lang="en" aria-label="Participants">
        {participants.map((participant, i) => (
            <li key={participant.xmlId || i}>
                {participant.role && (
                    <span className="role">{participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}: </span>
                )}
                {participant.name}
            </li>
        ))}
    </ul>
)

/** The routes for the elements above, given what the page knows */
export const lessonRoutes = (context: LessonContext) => ({
    'tei-u': (props: RouteProps) => <Utterance {...props} participants={context.participants} />,
    'tei-kinesic': (props: RouteProps) => <Action {...props} context={context} />,
    'tei-incident': (props: RouteProps) => <Action {...props} context={context} />,
    'tei-vocal': (props: RouteProps) => <Action {...props} context={context} />,
    'tei-ptr': (props: RouteProps) => <Pointer {...props} context={context} />,
    'tei-media': (props: RouteProps) => <Media {...props} context={context} />,
    'tei-gap': Gap,
})
