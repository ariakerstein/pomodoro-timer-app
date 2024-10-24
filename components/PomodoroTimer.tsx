import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Save, Download, Volume2, VolumeX, LogOut, Menu, X } from 'lucide-react'

interface TimerBlock {
  timestamp: string;
  duration: number;
  title: string;
  notes: string;
}

interface User {
  email: string;
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
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  useEffect(() => {
    const playSound = () => {
      if (isSoundEnabled) {
        const audio = new Audio('/notification.mp3')
        audio.play()
      }
    }

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
  }, [isRunning, isSoundEnabled])

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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    const newUser = { email }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
    setEmail('')
    setPassword('')
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setMobileMenuOpen(false)
  }

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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <nav className="bg-black p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          <div className={`md:flex ${mobileMenuOpen ? 'block' : 'hidden'} mt-4 md:mt-0`}>
            {user ? (
              <div className="flex flex-col md:flex-row items-center">
                <span className="mr-4 mb-2 md:mb-0">{user.email}</span>
                <button onClick={handleLogout} className="flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                  <LogOut className="mr-2" size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="flex flex-col md:flex-row items-center">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mr-2 p-2 rounded text-black mb-2 md:mb-0 w-full md:w-auto"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mr-2 p-2 rounded text-black mb-2 md:mb-0 w-full md:w-auto"
                  required
                />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 w-full md:w-auto mb-2 md:mb-0">
                  {isLogin ? 'Login' : 'Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-300 hover:text-blue-100 w-full md:w-auto"
                >
                  {isLogin ? 'Need an account?' : 'Have an account?'}
                </button>
              </form>
            )}
          </div>
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
          <div className="flex flex-wrap justify-center space-x-2 space-y-2 md:space-y-0 mb-6">
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
          <div className="bg-white shadow-sm rounded-lg p-6 overflow-x-auto">
            <h3 className="text-xl font-bold mb-4">Saved Blocks</h3>
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
            <div className="flex justify-end">
              <div className="relative">
                <button 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)} 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                >
                  <Download className="mr-2" size={18} />
                  Export
                </button>
                {exportMenuOpen  && (
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