class StaticPagesController < ApplicationController
  def home
  end

  def help
  end

  def about
  end

  def contact
  end

  def firework
    render layout: false
  end

  def cubic_ash
    render layout: false
  end

end
