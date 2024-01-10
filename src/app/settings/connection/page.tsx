'use client'

import { useState } from 'react'

export default function ConnectionSettings() {
  const [formData, setFormData] = useState({
    application_url: 'http://localhost:8383',
    next_auth_secret: '',
    tautulli_url: '',
    tautulli_api_key: '',
    overseerr_url: '',
    overseerr_api_key: '',
    tmdb_api_key: '',
    plex_hostname: 'localhost',
    plex_port: '32400',
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    console.log(JSON.stringify(formData))

    // const res = await fetch('/api/settings', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData),
    // })

    // const data = await res.json()
    // console.log(data)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  return (
    <form className='glass-sheet pb-6' onSubmit={handleSubmit}>
      <div className='grid gap-4'>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://localhost:8383'
            required
            name='application_url'
            value={formData.application_url}
            onChange={handleInputChange}
          />
          <span className='label'>Application URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='next_auth_secret'
            required
            value={formData.next_auth_secret}
            onChange={handleInputChange}
          />
          <span className='label'>Next Auth secret</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:8181'
            name='tautulli_url'
            required
            value={formData.tautulli_url}
            onChange={handleInputChange}
          />
          <span className='label'>Tautulli URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='tautulli_api_key'
            required
            value={formData.tautulli_api_key}
            onChange={handleInputChange}
          />
          <span className='label'>Tautulli API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:5055'
            name='overseerr_url'
            required
            value={formData.overseerr_url}
            onChange={handleInputChange}
          />
          <span className='label'>Overseerr URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='overseerr_api_key'
            required
            value={formData.overseerr_api_key}
            onChange={handleInputChange}
          />
          <span className='label'>Overseerr API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='tmdb_api_key'
            required
            value={formData.tmdb_api_key}
            onChange={handleInputChange}
          />
          <span className='label'>TMDB API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            placeholder='localhost'
            name='plex_hostname'
            required
            value={formData.plex_hostname}
            onChange={handleInputChange}
          />
          <span className='label'>Plex hostname</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            placeholder='32400'
            name='plex_port'
            required
            value={formData.plex_port}
            onChange={handleInputChange}
          />
          <span className='label'>Plex port</span>
        </label>
      </div>

      <button className='button ml-auto mt-6 w-full sm:w-fit' type='submit'>
        Save
      </button>
    </form>
  )
}
