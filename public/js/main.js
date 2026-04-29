// Main JavaScript for News Portal

$(document).ready(function() {
    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });

    // Search functionality
    $('.search-box form').on('submit', function(e) {
        var query = $(this).find('input[name="q"]').val().trim();
        if (query.length < 2) {
            e.preventDefault();
            alert('Please enter at least 2 characters to search.');
            return false;
        }
    });

    // Newsletter subscription
    $('#newsletter-form').on('submit', function(e) {
        e.preventDefault();
        var email = $(this).find('input[name="email"]').val();
        if (validateEmail(email)) {
            // AJAX submission
            $.ajax({
                url: '/api/newsletter',
                method: 'POST',
                data: { email: email },
                success: function(response) {
                    alert('Thank you for subscribing!');
                    $('#newsletter-form')[0].reset();
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                }
            });
        } else {
            alert('Please enter a valid email address.');
        }
    });

    // Dark mode toggle
    $('#dark-mode-toggle').on('click', function() {
        $('body').toggleClass('dark-mode');
        var isDark = $('body').hasClass('dark-mode');
        localStorage.setItem('darkMode', isDark);
        
        $(this).find('i').toggleClass('fa-moon fa-sun');
        $(this).find('span').text(isDark ? 'Light Mode' : 'Dark Mode');
    });

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        $('body').addClass('dark-mode');
        $('#dark-mode-toggle i').removeClass('fa-moon').addClass('fa-sun');
        $('#dark-mode-toggle span').text('Light Mode');
    }

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Breaking news ticker pause on hover
    $('.ticker').hover(
        function() { $(this).find('.ticker-content').css('animation-play-state', 'paused'); },
        function() { $(this).find('.ticker-content').css('animation-play-state', 'running'); }
    );

    // Load more news functionality
    $('#load-more-news').on('click', function() {
        var button = $(this);
        var page = button.data('page') || 2;
        
        button.prop('disabled', true).html('<span class="loading"></span> Loading...');
        
        $.ajax({
            url: '/api/news',
            method: 'GET',
            data: { page: page, limit: 6 },
            success: function(response) {
                if (response.news && response.news.length > 0) {
                    var newsHtml = '';
                    response.news.forEach(function(news) {
                        newsHtml += generateNewsCard(news);
                    });
                    $('#news-container').append(newsHtml);
                    button.data('page', page + 1);
                } else {
                    button.hide();
                }
                button.prop('disabled', false).html('Load More');
            },
            error: function() {
                alert('Error loading more news.');
                button.prop('disabled', false).html('Load More');
            }
        });
    });

    // Comment submission
    $('#comment-form').on('submit', function(e) {
        e.preventDefault();
        var formData = $(this).serialize();
        
        $.ajax({
            url: $(this).attr('action'),
            method: 'POST',
            data: formData,
            success: function(response) {
                alert('Comment submitted successfully!');
                $('#comment-form')[0].reset();
                // Optionally reload comments
                loadComments();
            },
            error: function(xhr) {
                var error = xhr.responseJSON ? xhr.responseJSON.message : 'An error occurred.';
                alert(error);
            }
        });
    });

    // Share buttons
    $('.share-btn').on('click', function(e) {
        e.preventDefault();
        var platform = $(this).data('platform');
        var url = encodeURIComponent(window.location.href);
        var title = encodeURIComponent(document.title);
        
        var shareUrl = '';
        switch(platform) {
            case 'facebook':
                shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
                break;
            case 'twitter':
                shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
                break;
            case 'linkedin':
                shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    });
});

// Utility functions
function updateDateTime() {
    var now = new Date();
    var date = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    var time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    $('#current-date').text(date);
    $('#current-time').text(time);
}

function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function generateNewsCard(news) {
    return `
        <div class="col-md-4 mb-4">
            <div class="card news-card">
                <img src="${news.image || '/images/placeholder.jpg'}" class="card-img-top" alt="${news.title}">
                <div class="card-body">
                    <h5 class="card-title"><a href="/news/${news.slug}">${news.title}</a></h5>
                    <p class="card-text">${news.summary ? news.summary.substring(0, 100) + '...' : ''}</p>
                    <div class="news-meta">
                        <small class="text-muted">
                            <i class="fas fa-user"></i> ${news.author_name} |
                            <i class="fas fa-clock"></i> ${new Date(news.created_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadComments() {
    var newsId = $('#comments-section').data('news-id');
    if (newsId) {
        $.ajax({
            url: '/api/comments/' + newsId,
            method: 'GET',
            success: function(response) {
                var commentsHtml = '';
                if (response.comments && response.comments.length > 0) {
                    response.comments.forEach(function(comment) {
                        commentsHtml += `
                            <div class="comment mb-3">
                                <div class="comment-header">
                                    <strong>${comment.name}</strong>
                                    <small class="text-muted">${new Date(comment.created_at).toLocaleDateString()}</small>
                                </div>
                                <div class="comment-body">
                                    ${comment.comment}
                                </div>
                            </div>
                        `;
                    });
                } else {
                    commentsHtml = '<p>No comments yet.</p>';
                }
                $('#comments-list').html(commentsHtml);
            }
        });
    }
}

// Initialize comments on news page
if ($('#comments-section').length > 0) {
    loadComments();
}