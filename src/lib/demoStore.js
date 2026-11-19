// Local demo store: keeps CipherStudio usable when the API host is asleep or
// retired. Everything lives in localStorage, so a refresh keeps your edits.

const KEY = 'cipherstudio_demo_v2'

const appJs1 = `export default function App() {
  const skills = ['React', 'Next.js', 'Sandpack']
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Hi, I am a demo project</h1>
      <p>Edit this file and the preview updates instantly.</p>
      <ul>
        {skills.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </div>
  )
}
`

const appJs2 = `import { useState } from 'react'

export default function App() {
  const [items, setItems] = useState(['Ship a feature', 'Write the README'])
  const [text, setText] = useState('')

  const add = () => {
    if (!text.trim()) return
    setItems([...items, text.trim()])
    setText('')
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Todo</h1>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New item" />
      <button onClick={add}>Add</button>
      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}
`

function seed() {
  return {
    projects: [
      {
        _id: 'demo-project-1',
        name: 'Portfolio Card',
        description: 'A small React component you can edit and preview live.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'demo-project-2',
        name: 'Todo List',
        description: 'State, props and events in one file.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    files: {
      'demo-project-1': [
        { _id: 'p1-app', name: 'App.js', type: 'file', parentId: null, content: appJs1 },
      ],
      'demo-project-2': [
        { _id: 'p2-app', name: 'App.js', type: 'file', parentId: null, content: appJs2 },
      ],
    },
  }
}

export function loadDemo() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const fresh = seed()
  persist(fresh)
  return fresh
}

function persist(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export function demoProjectList() {
  return loadDemo().projects
}

export function demoProject(id) {
  const state = loadDemo()
  return {
    project: state.projects.find((p) => p._id === id),
    files: state.files[id] || [],
  }
}

export function demoCreateProject({ name, description }) {
  const state = loadDemo()
  const id = 'demo-project-' + Date.now()
  const project = {
    _id: id,
    name,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.projects.unshift(project)
  state.files[id] = [
    {
      _id: id + '-app',
      name: 'App.js',
      type: 'file',
      parentId: null,
      content: `export default function App() {\n  return <h1>${String(name).replace(/[<>]/g, '')}</h1>\n}\n`,
    },
  ]
  persist(state)
  return project
}

export function demoDeleteProject(id) {
  const state = loadDemo()
  state.projects = state.projects.filter((p) => p._id !== id)
  delete state.files[id]
  persist(state)
}

export function demoUpdateFile(id, content) {
  const state = loadDemo()
  for (const [projectId, list] of Object.entries(state.files)) {
    const file = list.find((f) => f._id === id)
    if (file) {
      file.content = content
      const project = state.projects.find((p) => p._id === projectId)
      if (project) project.updatedAt = new Date().toISOString()
      persist(state)
      return file
    }
  }
  return null
}

export const DEMO_ACCOUNT = {
  email: 'demo@cipherstudio.dev',
  password: 'demo1234',
}
