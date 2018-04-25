import axios from 'axios'
import md5 from 'md5'
import _config from '../../config.js'
import api from './config-api-server.js'

axios.defaults.timeout = 3000
axios.defaults.headers['Content-Type'] = 'application/json'

const baseUrl = 'https://api.github.com'

function findMaxPage(curPage, linkStr) {
  const arr = linkStr.split('page=').filter(el => {
    return el.match(/&per_/)
  })
  if (curPage - Math.max(...arr.map(el => { return Number(el.replace(/&per_/, '')) })) === 1) {
    return curPage
  }
  return Math.max(...arr.map(el => { return Number(el.replace(/&per_/, '')) }))
}

function warmCache() {
  fetchIssues(1, 10)
  fetchRepos()
  setTimeout(warmCache, 1000 * 60 * 15)
}

if (api.onServer) {
  warmCache()
}

export function fetchIssues(page, size) {
  const key = md5(`issues-${page}`)

  return new Promise((resolve,reject) => {
    if (api.cached && api.cached.has(key)) {
      resolve(api.cached.get(key))
    }

    return axios({
      method: 'get',
      url: `${baseUrl}/repos/${_config.user}/${_config.repo}/issues`,
      params: {
        access_token: _config.token,
        sort: 'created',
        page: Number(page),
        per_page: Number(size)
      }
    }).then(data => {
      const rows = {
        content: data.data,
        maxPage: findMaxPage(page, data.headers.link)
      }
      if (api.cached) {
        api.cached.set(key, rows)
      }
      resolve(rows)
    }).catch(data => {
      console.log(data)
      reject(data)
    })
  })
}

export function fetchUser() {
  const key = 'user'
  return new Promise((resolve,reject) => {
    if (api.cached && api.cached.has(key)) {
      resolve(api.cached.get(key))
    }

    return axios({
      method: 'get',
      url: `${baseUrl}/users/${_config.user}`,
      params: {
        access_token: _config.token,
      }
    }).then(data => {
      if (api.cached) {
        api.cached.set(key, data.data)
      }
      resolve(data.data)
    }).catch(data => {
      reject(data)
    })
  })
}

export function fetchRepos() {
  const key = 'repos'
  return new Promise((resolve,reject) => {
    if (api.cached && api.cached.has(key)) {
      resolve(api.cached.get(key))
    }

    return axios({
      method: 'get',
      url: `${baseUrl}/users/${_config.user}/repos`,
      params: {
        access_token: _config.token,
        sort: 'created',
        direction: 'desc'
      }
    }).then(data => {
      if (api.cached) {
        api.cached.set(key, data.data)
      }
      resolve(data.data)
    }).catch(data => {
      reject(data)
    })
  })
}

export function fetchSingleIssue(number) {
  const key = md5(`singleissue-${number}`)
  return new Promise((resolve,reject) => {
    if (api.cached && api.cached.has(key)) {
      resolve(api.cached.get(key))
    }

    return axios({
      method: 'get',
      url: `${baseUrl}/repos/${_config.user}/${_config.repo}/issues/${number}`,
      params: {
        access_token: _config.token
      }
    }).then(data => {
      if (api.cached) {
        api.cached.set(key, data.data)
      }
      resolve(data.data)
    }).catch(data => {
      reject(data)
    })
  })
}
