module ApplicationHelper
  def base_title
    "Blue Balloon Blog"
  end

  def full_title(page_title = '')
    if page_title.empty?
      base_title
    else
      page_title + " | " + base_title
    end
  end
end
