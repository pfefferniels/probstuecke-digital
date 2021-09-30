import React from 'react'

const useNavigation = (toc, history) => {
   const findInToc = (path) => {
     for (const [n, value] of Object.entries(toc.data)) {
       for (const [key, edition] of Object.entries(value.editions)) {
         if (edition.comments === path) {
           return {n, key}
         }
       }
     }
   }

   const navigateTo = (path) => {
     const where = findInToc(path)
     history.push(`/n${where.n}/${where.key}`)
   }

   return {
      navigateTo
   }
}

export default useNavigation
