import reactRouterExtends from "."
import { render, renderHook } from '@testing-library/react'
import type { ExtendedRoutes } from "."

const RR = {
  navigate: jest.fn(),
  Link: jest.fn(),
  NavLink: jest.fn(),
  Navigate: jest.fn(),
}

jest.mock('react-router-dom', () => {
  const ReactRouter = jest.requireActual('react-router-dom')

  return {
    ...ReactRouter,
    useNavigate: () => RR.navigate,
    Link: (props: any) => RR.Link(props),
    NavLink: (props: any) => RR.NavLink(props),
    Navigate: (props: any) => RR.Navigate(props)
  }
})

const routes = [
  {
    id: 'root',
    path: '/',
    children: [
      {
        id: 'users',
        path: 'users',
        children: [
          {
            id: 'index',
            index: true
          },
          {
            id: 'show',
            path: ':id',
            children: [
              {
                id: 'attribute',
                path: ':attribute'
              }
            ]
          }
        ]
      },
      {
        id: 'posts',
        path: 'posts',
        children: [
          {
            id: 'index',
            index: true
          },
          {
            id: 'show',
            path: ':id'
          }
        ]
      }
    ]
  },
  {
    id: 'foo',
    path: 'foo',
    children: [
      {
        id: 'bar',
        path: 'bar'
      }
    ]
  },
] as const satisfies ExtendedRoutes

const { getPathFromId, generatePathFromId, Link, NavLink, Navigate, useNavigate } = reactRouterExtends(routes)

describe('getPathFromId', () => {
  it.each([
    { id: 'root', path: '/' },
    { id: 'root.users', path: '/users' },
    { id: 'root.users.index', path: '/users' },
    { id: 'root.users.show', path: '/users/:id' },
    { id: 'root.users.show.attribute', path: '/users/:id/:attribute' },
    { id: 'root.posts', path: '/posts' },
    { id: 'root.posts.index', path: '/posts' },
    { id: 'root.posts.show', path: '/posts/:id' },
    { id: 'foo', path: '/foo' },
    { id: 'foo.bar', path: '/foo/bar' },
  ] as const)('id: $id, path: $path', ({ id, path }) => {
    expect(getPathFromId(id)).toEqual(path)
  })

  it('throws error if route not found', () => {
    // @ts-ignore
    expect(() => getPathFromId('foo.bar.baz')).toThrow('Route not found')
  })
})

describe('generatePathFromId', () => {
  it('[root] returns /', () => {
    expect(generatePathFromId('root')).toEqual('/')
  })

  it('[foo] returns /foo', () => {
    expect(generatePathFromId('foo')).toEqual('/foo')
  })

  it('[root.posts.show] returns /posts/1 with id = 1', () => {
    expect(generatePathFromId('root.posts.show', { id: '1' })).toEqual('/posts/1')
  })

  it('[root.users.show.attribute] returns /users/2/name with id = 2 and attribute = name', () => {
    expect(generatePathFromId('root.users.show.attribute', { id: '2', attribute: 'name' })).toEqual('/users/2/name')
  })
})

describe('useNavigate', () => {
  it("generates path and pass to react-router's navigate", () => {
    const { result } = renderHook(() => useNavigate())
    result.current('root')
    expect(RR.navigate).toBeCalledWith('/', {})

    result.current('root.posts.show', { params: { id: '1' }, replace: true })
    expect(RR.navigate).toBeCalledWith('/posts/1', { replace: true })

    result.current('root.users.show.attribute', { params: { id: '1', attribute: 'email' } })
    expect(RR.navigate).toBeCalledWith('/users/1/email', {})
  })
})

describe.each`
  name          | Component   | RRComponent
  ${'Link'}     | ${Link}     | ${RR.Link}
  ${'NavLink'}  | ${NavLink}  | ${RR.NavLink}
  ${'Navigate'} | ${Navigate} | ${RR.Navigate}
`('$name', ({ Component, RRComponent }) => {
  it('renders Navigate with id: root', () => {
    render(<Component to='root' />)
    expect(RRComponent).toBeCalledWith({ to: '/' })
  })
  it('renders Navigate with id: foo', () => {
    render(<Component to='foo' />)
    expect(RRComponent).toBeCalledWith({ to: '/foo' })
  })
  it('renders Navigate with id: foo.bar', () => {
    render(<Component to='foo.bar' />)
    expect(RRComponent).toBeCalledWith({ to: '/foo/bar'})
  })
  it('renders Navigate with id: root.users', () => {
    render(<Component to='root.users' />)
    expect(RRComponent).toBeCalledWith({ to: '/users' })
  })
  it('renders Navigate with id: root.posts.index', () => {
    render(<Component to='root.posts.index' />)
    expect(RRComponent).toBeCalledWith({ to: '/posts' })
  })
  it('renders Navigate with id: root.posts.show', () => {
    render(<Component to='root.posts.show' params={{ id: '1' }} />)
    expect(RRComponent).toBeCalledWith({ to: '/posts/1' })
  })
  it('renders Navigate with id: root.users.show.attribute', () => {
    render(<Component to='root.users.show.attribute' params={{ id: '1', attribute: 'phone' }}  />)
    expect(RRComponent).toBeCalledWith({ to: '/users/1/phone' })
  })
})
