import React, { forwardRef, useCallback } from 'react'
import { generatePath, useNavigate as useRRNavigate, Link, NavLink, Navigate } from 'react-router-dom'
import type { NavigateOptions, ParamParseKey, RouteObject } from 'react-router-dom'

export type ExtendedRoute = Readonly<
  Omit<RouteObject, 'id' | 'children'> & {
    id: string,
    children?: ExtendedRoutes
  }
>

export type ExtendedRoutes = ReadonlyArray<ExtendedRoute>

type RouteIds<Routes> = Routes extends ReadonlyArray<infer Route>
  ? Route extends ExtendedRoute
    ? Route['children'] extends ExtendedRoutes
      ? Route['id'] | `${Route['id']}.${RouteIds<Route['children']>}`
      : Route['id']
    : never
  : never

type PathSegment<Path> = Path extends string
  ? Path extends `/`
    ? ''
    : Path extends `/${infer Rest}`
      ? `/${Rest}`
      : `/${Path}`
  : ''

type GetRoutePath<Routes, Id> = Routes extends ReadonlyArray<infer Route>
  ? Route extends ExtendedRoute
    ? Id extends `${infer Prefix}.${infer Rest}`
      ? Route['id'] extends Prefix
        ? `${PathSegment<Route['path']>}${GetRoutePath<Route['children'], Rest>}`
        : never
      : Route['id'] extends Id
        ? PathSegment<Route['path']>
        : never
    : never
  : never

type RoutePath<Routes, Id, Path = GetRoutePath<Routes, Id>> = Path extends ''
  ? '/'
  : Path

type PathParams<Routes, Id> = {
  [id in ParamParseKey<RoutePath<Routes, Id>>]: string | null
}

type RouteParams<Routes, Id> = string extends ParamParseKey<RoutePath<Routes, Id>>
  ? { params?: undefined }
  : { params: PathParams<Routes, Id>}

type ExtendedProps<T extends React.ElementType, Routes extends ExtendedRoutes, Id extends RouteIds<Routes>> =
  & Omit<React.ComponentPropsWithoutRef<T>, 'to'>
  & { to: Id }
  & RouteParams<Routes, Id>

type ExtendedComponent<T extends React.ElementType, Routes extends ExtendedRoutes, E = {}> = <Id extends RouteIds<Routes>>(props: ExtendedProps<T, Routes, Id> & E) => JSX.Element

function getPathFromIdWithRoutes<R extends ExtendedRoutes, Id extends RouteIds<R>>(routes: R, id: Id): RoutePath<R, Id> {
  const [id1, ...ids] = id.split('.')
  const route = routes.find(r => r.id === id1)

  if (!route) throw new Error('Route not found')

  const path = route.path ? `/${route.path.replace(/^\//, '')}` : ''

  if (ids.length === 0) return path as RoutePath<R, Id>

  return path.replace(/\/$/, '') + getPathFromIdWithRoutes(route.children || [], ids.join('.')) as RoutePath<R, Id>
}

export default function reactRouterExtends<Routes extends ExtendedRoutes>(routes: Routes) {
  function getPathFromId<Id extends RouteIds<Routes>>(id: Id) {
    return getPathFromIdWithRoutes(routes, id)
  }

  function generatePathFromId<Id extends RouteIds<Routes>>(id: Id, params?: PathParams<Routes, Id>) {
    const path = getPathFromId(id)
    return generatePath(path, params)
  }

  function useNavigate() {
    const navigate = useRRNavigate()
    return useCallback(<Id extends RouteIds<Routes>>(id: Id, opts?: NavigateOptions & RouteParams<Routes, Id>) => {
      const { params, ...rest } = opts || {}
      const to = generatePathFromId(id, params)
      return navigate(to, rest)
    }, [navigate])
  }

  function withGeneratedPath<T extends React.ElementType>(Component: T): ExtendedComponent<T, Routes>
  function withGeneratedPath<T extends React.ElementType>(Component: T, shouldForwardRef: true): ExtendedComponent<T, Routes, { ref?: React.Ref<React.ComponentRef<T>> }>
  function withGeneratedPath<T extends React.ElementType>(
    Component: T,
    shouldForwardRef = false
  ) {
    if (!shouldForwardRef) return function ComponentWithGeneratedPath<Id extends RouteIds<Routes>>({ to, params, ...rest }: ExtendedProps<T, Routes, Id>) {
      const props = {
        ...rest,
        to: generatePathFromId(to, params)
      } as React.ComponentPropsWithRef<T>

      return <Component {...props} />
    }

    return forwardRef<React.ComponentRef<T>, ExtendedProps<T, Routes, RouteIds<Routes>>>(({ to, params, ...rest }, ref) => {
      const props = {
        ...rest,
        ref,
        to: generatePathFromId(to, params)
      } as React.ComponentPropsWithRef<T>

      return <Component {...props} />
    })
  }

  return {
    getPathFromId,
    generatePathFromId,
    useNavigate,
    Link: withGeneratedPath(Link, true),
    NavLink: withGeneratedPath(NavLink, true),
    Navigate: withGeneratedPath(Navigate),
  }
}