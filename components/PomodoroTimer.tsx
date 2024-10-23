import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Save, Download, Volume2, VolumeX, LogOut } from 'lucide-react'

interface TimerBlock {
  timestamp: string;
  duration: number;
  title: string;
  notes: string;
}

interface User {
  username: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  return `${seconds < 0 ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const PomodoroTimer: React.FC = () => {
  const [time, setTime] = useState<number>(25 * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isLongSession, setIsLongSession] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [savedBlocks, setSavedBlocks] = useState<TimerBlock[]>([])
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false)

  const playSound = () => {
    if (isSoundEnabled) {
      const audio = new Audio('/notification.mp3')
      audio.play()
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime > 0) {
            return prevTime - 1
          } else {
            setIsRunning(false)
            playSound()
            return 0
          }
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, playSound])

  useEffect(() => {
    const storedBlocks = localStorage.getItem('pomodoroBlocks')
    if (storedBlocks) {
      setSavedBlocks(JSON.parse(storedBlocks))
    }
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const toggleTimer = () => {
    if (time === 0) {
      resetTimer()
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTime(isLongSession ? 50 * 60 : 25 * 60)
  }

  const toggleSessionLength = () => {
    setIsLongSession(!isLongSession)
    setTime(isLongSession ? 25 * 60 : 50 * 60)
    setIsRunning(false)
  }

  const saveBlock = () => {
    if (!user) return
    const newBlock: TimerBlock = {
      timestamp: new Date().toISOString(),
      duration: isLongSession ? 50 * 60 - time : 25 * 60 - time,
      title,
      notes
    }
    const updatedBlocks = [...savedBlocks, newBlock]
    setSavedBlocks(updatedBlocks)
    localStorage.setItem('pomodoroBlocks', JSON.stringify(updatedBlocks))
    setTitle('')
    setNotes('')
    playSound()
  }

  const generateCSV = () => {
    const headers = ['Timestamp', 'Duration', 'Title', 'Notes']
    const csvContent = [
      headers.join(','),
      ...savedBlocks.map(block => [
        new Date(block.timestamp).toLocaleString(),
        formatTime(block.duration),
        block.title,
        block.notes
      ].map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'pomodoro_blocks.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const exportToMarkdownApp = (app: 'bear' | 'apple-notes' | 'obsidian') => {
    const markdownContent = savedBlocks.map(block => `
# ${block.title}

- Duration: ${formatTime(block.duration)}
- Timestamp: ${new Date(block.timestamp).toLocaleString()}

${block.notes}

#pomodoro
`).join('\n---\n')

    const encodedContent = encodeURIComponent(markdownContent)
    let url

    switch (app) {
      case 'bear':
        url = `bear://x-callback-url/create?text=${encodedContent}`
        break
      case 'apple-notes':
        url = `mobilenotes://x-callback-url/create?text=${encodedContent}`
        break
      case 'obsidian':
        url = `obsidian://new?content=${encodedContent}`
        break
    }

    window.location.href = url
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-black p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
          {user && (
            <div className="flex items-center">
              <span className="mr-4">Welcome, {user.username}</span>
              <button onClick={logout} className="flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                <LogOut className="mr-2" size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold mb-6 text-center">{formatTime(time)}</h2>
          <div className="flex items-center justify-center mb-6">
            <span className="mr-2 text-gray-600">25 min</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isLongSession} onChange={toggleSessionLength} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="ml-2 text-gray-600">50 min</span>
          </div>
          <div className="flex justify-center space-x-4 mb-6">
            <button onClick={toggleTimer} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center">
              {isRunning ? <Pause className="mr-2" size={18} /> : <Play className="mr-2" size={18} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button onClick={resetTimer} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full transition duration-300 flex items-center">
              <RotateCcw className="mr-2" size={18} />
              Reset
            </button>
            <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full transition duration-300 flex items-center">
              {isSoundEnabled ? <Volume2 className="mr-2" size={18} /> : <VolumeX className="mr-2" size={18} />}
              {isSoundEnabled ? 'Sound On' : 'Sound Off'}
            </button>
          </div>
          <input
            type="text"
            placeholder="Block Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button 
            onClick={saveBlock} 
            disabled={!user} 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center justify-center mx-auto"
          >
            <Save className="mr-2" size={18} />
            Save Block
          </button>
          {!user && <p className="text-red-500 text-sm mt-2 text-center">Please log in to save blocks</p>}
        </div>

        {savedBlocks.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Saved Blocks</h3>
            <div className="overflow-x-auto">
              <table className="w-full mb-4">
                <thead>
                  <tr>
                    <th className="text-left text-gray-600 py-2">Timestamp</th>
                    <th className="text-left text-gray-600 py-2">Duration</th>
                    <th className="text-left text-gray-600 py-2">Title</th>
                    <th className="text-left text-gray-600 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {savedBlocks.map((block, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 text-gray-800">{new Date(block.timestamp).toLocaleString()}</td>
                      <td className="py-2 text-gray-800">{formatTime(block.duration)}</td>
                      <td className="py-2 text-gray-800">{block.title}</td>
                      <td className="py-2 text-gray-800">
                        <pre className="whitespace-pre-wrap">{block.notes}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="relative">
                <button 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)} 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                >
                  <Download className="mr-2" size={18} />
                  Export
                </button>
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <button onClick={generateCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Export as CSV
                    </button>
                    <button onClick={() => exportToMarkdownApp('bear')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Export to Bear
                    </button>
                    <button onClick={() => exportToMarkdownApp('apple-notes')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Export to Apple Notes
                    </button>
                    <button onClick={() => exportToMarkdownApp('obsidian')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Export to Obsidian
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PomodoroTimer