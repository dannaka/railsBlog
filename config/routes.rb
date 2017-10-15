Rails.application.routes.draw do
  get 'static_pages/firework'
  get 'static_pages/cubic_ash'
  get '/cubic_ash', to: 'static_pages#cubic_ash'

  get 'users/new'

  root 'static_pages#home'
  get '/home', to: 'static_pages#home'
  get '/help', to: 'static_pages#help'
  get '/about', to: 'static_pages#about'
  get '/contact', to: 'static_pages#contact'
  get '/firework', to: 'static_pages#firework'

  get '/signup', to: 'users#new'

  resources :users
  resources :microposts
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

end
