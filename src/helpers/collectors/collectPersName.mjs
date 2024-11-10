export const collectPersName = (el) => {
    if (!el) return undefined

    const surname = el.querySelector('surname')?.textContent || ''
    const forename = el.querySelector('forename')?.textContent || ''

    return {
        surname,
        forename
    }
}
