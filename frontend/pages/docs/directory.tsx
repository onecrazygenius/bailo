import Router from 'next/router'
import { useEffect } from 'react'

export default function RedirectDirectoryVisitor() {
  useEffect(() => {
    Router.push('/docs')
  }, [])
}

export interface DirectoryEntry {
  title: string
  slug: string
  header?: boolean
}

export const flatDirectory: Array<DirectoryEntry> = [
  // Main Docs
  { title: 'Overview', slug: '', header: true },

  { title: 'Getting Started', slug: 'getting-started', header: true },

  { title: 'FAQ', slug: 'getting-started/faq' },
  { title: `What's new in V2?`, slug: 'getting-started/whats-new-in-v2' },

  // Users
  { title: 'Users', slug: 'users', header: true },

  { title: 'Managing Models and Releases', slug: 'users/managing-models-and-releases', header: true },
  { title: 'Uploading Artifacts', slug: 'users/managing-models-and-releases/upload-to-bailo', header: true },
  { title: 'Uploading Files', slug: 'users/managing-models-and-releases/upload-to-bailo/files' },
  { title: 'Uploading Images', slug: 'users/managing-models-and-releases/upload-to-bailo/images' },

  { title: 'Using a Model', slug: 'users/using-a-model', header: true },
  { title: 'Reviews', slug: 'users/reviews', header: true },
  { title: 'Programmatically using Bailo', slug: 'users/programmatically-using-bailo', header: true },
  { title: 'Authentication', slug: 'users/programmatically-using-bailo/authentication' },
  { title: 'Open API', slug: 'users/programmatically-using-bailo/open-api' },
  { title: 'Python Client', slug: 'users/programmatically-using-bailo/python-client' },
  // Administration
  { title: 'Administration', slug: 'administration', header: true },

  { title: 'Managing Bailo', slug: 'administration/managing-bailo', header: true },

  { title: 'Migrations', slug: 'administration/migrations', header: true },
  { title: 'Bailo 0.4', slug: 'administration/migrations/bailo-0.4' },
  { title: 'Bailo 2.0', slug: 'administration/migrations/bailo-2.0' },

  // Developers
  { title: 'Developers', slug: 'developers', header: true },

  { title: 'Bailo Development', slug: 'developers/bailo-development', header: true },

  // Markdown
  { title: 'Markdown Examples', slug: 'markdown-examples' },
]

export interface DirectoryTree {
  slug: string
  title: string
  header?: boolean
  children?: DirectoryTree[]
}

function slugsToTree(paths: Array<DirectoryEntry>) {
  const tree: DirectoryTree = {
    slug: '',
    title: 'Root',
    header: true,
    children: [],
  }

  for (const path of paths) {
    const parts = path.slug.split('/')

    let leaf = tree
    let currentId = ''

    for (const part of parts) {
      const isLastPart = part === parts[parts.length - 1]
      const isFirstPart = part === parts[0]

      currentId += (isFirstPart ? '' : '/') + part

      let child = leaf.children?.find((node) => node.slug === currentId)
      if (!child) {
        if (!leaf.children) leaf.children = []

        leaf.children.push({
          slug: currentId,
          title: path.title,
          ...(path.header ? { header: true } : {}),
          ...(isLastPart ? {} : { children: [] }),
        })

        child = leaf.children[leaf.children.length - 1]
      }

      leaf = child
    }
  }

  return tree
}

export const directory = slugsToTree(flatDirectory)
