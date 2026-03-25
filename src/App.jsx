import { useEffect, useMemo, useState } from 'react'
import './App.css'

const SORT_OPTIONS = {
  name: (user) => user.name.toLowerCase(),
  company: (user) => user.company.name.toLowerCase(),
}

function getRoute(pathname) {
  const match = pathname.match(/^\/user\/(\d+)\/?$/)

  if (match) {
    return { view: 'detail', userId: Number(match[1]) }
  }

  return { view: 'dashboard', userId: null }
}

function App() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [viewMode, setViewMode] = useState('table')
  const [route, setRoute] = useState(() => getRoute(window.location.pathname))
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('buyerforesight-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('buyerforesight-theme', theme)
  }, [theme])

  async function loadUsers(signal) {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('https://jsonplaceholder.typicode.com/users', {
        signal,
      })

      if (!response.ok) {
        throw new Error('Failed to load users.')
      }

      const data = await response.json()
      setUsers(data)
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        setError('Unable to load the directory right now. Please retry.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const abortController = new AbortController()
    loadUsers(abortController.signal)
    return () => abortController.abort()
  }, [])

  useEffect(() => {
    function syncRoute() {
      setRoute(getRoute(window.location.pathname))
    }

    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const visibleUsers = normalizedQuery
      ? users.filter((user) => {
          return (
            user.name.toLowerCase().includes(normalizedQuery) ||
            user.email.toLowerCase().includes(normalizedQuery)
          )
        })
      : users

    return [...visibleUsers].sort((left, right) => {
      const leftValue = SORT_OPTIONS[sortField](left)
      const rightValue = SORT_OPTIONS[sortField](right)
      const comparison = leftValue.localeCompare(rightValue)
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [query, sortDirection, sortField, users])

  const selectedUser = route.userId
    ? users.find((user) => user.id === route.userId) ?? null
    : null

  const companyCount = new Set(users.map((user) => user.company.name)).size
  const cityCount = new Set(users.map((user) => user.address.city)).size

  function navigateTo(pathname) {
    window.history.pushState({}, '', pathname)
    setRoute(getRoute(pathname))
  }

  function handleSort(field) {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection('asc')
  }

  function handleRefresh() {
    const abortController = new AbortController()
    loadUsers(abortController.signal)
  }

  if (route.view === 'detail') {
    return (
      <main className="app-shell">
        <DirectoryBackdrop />
        <section className="page page-detail page-enter">
          <button className="ghost-button" onClick={() => navigateTo('/')}>
            Back to directory
          </button>
          {loading ? (
            <DetailSkeleton />
          ) : error ? (
            <StatusCard title="Something went wrong" message={error} />
          ) : selectedUser ? (
            <UserDetail user={selectedUser} onNavigate={navigateTo} />
          ) : (
            <StatusCard
              title="User not found"
              message="The profile you requested is not available in this directory."
            />
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <DirectoryBackdrop />
      <section className="page page-enter">
        <header className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">BuyerForeSight user directory</p>
            <h1>Find the right contact before the next decision gets made.</h1>
            <p className="hero-text">
              Search, sort, scan fast, and move from overview to full profile
              without the UI feeling like a plain assignment table.
            </p>
            <div className="hero-pills">
              <span>Responsive dashboard</span>
              <span>Table and card views</span>
              <span>Profile-first detail page</span>
            </div>
          </div>

          <div className="hero-stats">
            <button
              className="theme-toggle"
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === 'light' ? 'dark' : 'light',
                )
              }
            >
              {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            </button>
            <StatCard label="Profiles loaded" value={users.length || '--'} />
            <StatCard label="Companies" value={companyCount || '--'} />
            <StatCard label="Cities" value={cityCount || '--'} />
            <StatCard
              label="Active sort"
              value={`${capitalize(sortField)} ${sortDirection}`}
            />
          </div>
        </header>

        <section className="toolbar-panel">
          <label className="search-field">
            <span>Search by name or email</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Leanne, Ervin, or @biz.com"
            />
          </label>

          <div className="toolbar-group">
            <div className="sort-actions" role="group" aria-label="Sort users">
              <button
                className={sortField === 'name' ? 'sort-button active' : 'sort-button'}
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' ? sortLabel(sortDirection) : ''}
              </button>
              <button
                className={
                  sortField === 'company' ? 'sort-button active' : 'sort-button'
                }
                onClick={() => handleSort('company')}
              >
                Company {sortField === 'company' ? sortLabel(sortDirection) : ''}
              </button>
            </div>

            <div className="view-toggle" role="group" aria-label="Change view">
              <button
                className={viewMode === 'table' ? 'sort-button active' : 'sort-button'}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
              <button
                className={viewMode === 'cards' ? 'sort-button active' : 'sort-button'}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </button>
            </div>

            <button className="secondary-button" onClick={handleRefresh}>
              Refresh data
            </button>
          </div>
        </section>

        {loading ? (
          <DirectorySkeleton />
        ) : error ? (
          <StatusCard title="Something went wrong" message={error} />
        ) : (
          <>
            <section className="insight-strip">
              <article className="insight-card">
                <span className="section-label">Visible now</span>
                <strong>{filteredUsers.length}</strong>
                <p>Profiles matching your current search and sorting rules.</p>
              </article>
              <article className="insight-card">
                <span className="section-label">Top city spread</span>
                <strong>{filteredUsers[0]?.address.city ?? '--'}</strong>
                <p>The first visible record sets the current shortlist context.</p>
              </article>
              <article className="insight-card">
                <span className="section-label">Future-ready</span>
                <strong>{viewMode === 'table' ? 'Structured view' : 'Visual view'}</strong>
                <p>Switch modes without changing the underlying data logic.</p>
              </article>
            </section>

            <section className="directory-panel">
              <div className="directory-header">
                <div>
                  <p className="section-label">Directory</p>
                  <h2>People and companies</h2>
                </div>
                <p className="directory-meta">
                  Click any item to open the full profile.
                </p>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <p>No users match your search.</p>
                  <button className="ghost-button" onClick={() => setQuery('')}>
                    Clear search
                  </button>
                </div>
              ) : viewMode === 'table' ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          tabIndex="0"
                          onClick={() => navigateTo(`/user/${user.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              navigateTo(`/user/${user.id}`)
                            }
                          }}
                        >
                          <td>
                            <div className="person-cell">
                              <span className="avatar" aria-hidden="true">
                                {getInitials(user.name)}
                              </span>
                              <div>
                                <strong>{user.name}</strong>
                                <span>@{user.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>{user.company.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-grid">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className="user-card"
                      onClick={() => navigateTo(`/user/${user.id}`)}
                    >
                      <div className="user-card-top">
                        <span className="avatar large-avatar" aria-hidden="true">
                          {getInitials(user.name)}
                        </span>
                        <span className="company-chip">{user.company.name}</span>
                      </div>
                      <div className="user-card-copy">
                        <h3>{user.name}</h3>
                        <p>@{user.username}</p>
                      </div>
                      <dl className="user-meta">
                        <div>
                          <dt>Email</dt>
                          <dd>{user.email}</dd>
                        </div>
                        <div>
                          <dt>Phone</dt>
                          <dd>{user.phone}</dd>
                        </div>
                        <div>
                          <dt>City</dt>
                          <dd>{user.address.city}</dd>
                        </div>
                      </dl>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function DirectoryBackdrop() {
  return (
    <div className="background-layer" aria-hidden="true">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>
      <div className="grid-glow"></div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function StatusCard({ title, message }) {
  return (
    <section className="status-card">
      <p className="section-label">Directory status</p>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  )
}

function DirectorySkeleton() {
  return (
    <>
      <section className="insight-strip">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="insight-card">
            <div className="skeleton-line skeleton-line-short shimmer"></div>
            <div className="skeleton-line skeleton-line-title shimmer"></div>
            <div className="skeleton-line shimmer"></div>
          </article>
        ))}
      </section>
      <section className="directory-panel">
        <div className="directory-header">
          <div>
            <p className="section-label">Directory</p>
            <h2>Loading people and companies</h2>
          </div>
          <p className="directory-meta">Preparing the directory view.</p>
        </div>
        <div className="skeleton-table">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton-row">
              <div className="skeleton-block avatar-block shimmer"></div>
              <div className="skeleton-block shimmer"></div>
              <div className="skeleton-block shimmer"></div>
              <div className="skeleton-block shimmer"></div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function DetailSkeleton() {
  return (
    <section className="detail-layout">
      <section className="profile-banner">
        <div className="profile-mark shimmer"></div>
        <div className="profile-copy skeleton-copy">
          <div className="skeleton-line skeleton-line-short shimmer"></div>
          <div className="skeleton-line skeleton-line-title shimmer"></div>
          <div className="skeleton-line shimmer"></div>
        </div>
      </section>
      <section className="detail-cards">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="info-card">
            <div className="skeleton-line skeleton-line-short shimmer"></div>
            <div className="skeleton-line shimmer"></div>
          </article>
        ))}
      </section>
    </section>
  )
}

function UserDetail({ user, onNavigate }) {
  const cards = [
    { label: 'Email', value: user.email },
    { label: 'Phone', value: user.phone },
    { label: 'Website', value: user.website },
    { label: 'Company', value: user.company.name },
  ]

  return (
    <article className="detail-layout">
      <section className="profile-banner spotlight-banner">
        <div className="profile-mark">{getInitials(user.name)}</div>
        <div className="profile-copy">
          <p className="eyebrow">User profile</p>
          <h1>{user.name}</h1>
          <p className="hero-text">
            @{user.username} works with {user.company.name}. Reach them directly
            or review their address and company details below.
          </p>
          <div className="detail-actions">
            <a className="action-link" href={`mailto:${user.email}`}>
              Email
            </a>
            <a className="action-link" href={`tel:${user.phone}`}>
              Call
            </a>
            <a
              className="action-link"
              href={`https://${user.website}`}
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
          </div>
        </div>
      </section>

      <section className="detail-cards">
        {cards.map((card) => (
          <article key={card.label} className="info-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <p className="section-label">Address</p>
          <h2>Office location</h2>
          <p>
            {user.address.suite}, {user.address.street}
          </p>
          <p>
            {user.address.city}, {user.address.zipcode}
          </p>
          <p>Geo: {user.address.geo.lat}, {user.address.geo.lng}</p>
        </article>

        <article className="detail-card">
          <p className="section-label">Company</p>
          <h2>Business snapshot</h2>
          <p>{user.company.name}</p>
          <p>{user.company.catchPhrase}</p>
          <p>{user.company.bs}</p>
        </article>
      </section>

      <button className="primary-button" onClick={() => onNavigate('/')}>
        Return to dashboard
      </button>
    </article>
  )
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function sortLabel(direction) {
  return direction === 'asc' ? 'ASC' : 'DESC'
}

function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

export default App
