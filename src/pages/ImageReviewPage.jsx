import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ImageReviewPage() {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [marked, setMarked] = useState([]);
  const [thumbStart, setThumbStart] = useState(0);
  const thumbnailsToShow = 5;
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const sessionId = localStorage.getItem('session_id');

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('image_staging_for_review')
      .select('id, image_url, resume_url, query')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch images:', error);
    } else {
      setImages(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sessionId) fetchImages();
  }, [sessionId]);

  const toggleDelete = () => {
    const id = images[current]?.id;
    if (!id) return;
    setMarked(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // const confirmDelete = async () => {
  //   if (!marked.length) {
  //     setToast('Please select at least one image before proceeding.');
  //     setTimeout(() => setToast(''), 3000);
  //     return;
  //   }

  //   const { data: resumeData, error: resumeError } = await supabase
  //     .from('image_staging_for_review')
  //     .select('resume_url')
  //     .eq('session_id', sessionId)
  //     .neq('resume_url', null)
  //     .neq('resume_url', '')

  //   const idsToDelete = images
  //     .filter(img => !marked.includes(img.id))
  //     .map(img => img.id);

  //   if (idsToDelete.length) {
  //     const { error } = await supabase
  //       .from('image_staging_for_review')
  //       .delete()
  //       .in('id', idsToDelete);

  //     if (error) {
  //       console.error('Deletion error:', error);
  //       alert('Failed to delete images');
  //       return;
  //     }
  //   }

  //   const updated = images.filter(img => marked.includes(img.id));
  //   setImages(updated);
  //   setMarked([]);
  //   setCurrent(0);
  //   setThumbStart(0);


  //   if (resumeError) {
  //     console.error('Failed to fetch resume URLs:', resumeError);
  //   } else {
  //     const resumeUrls = [...new Set(resumeData.map(row => row.resume_url))];
    
  //     if (resumeUrls.length) {
  //       try {
  //         await fetch('https://9iaealus91.execute-api.us-east-1.amazonaws.com/invoke-webhook', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({
  //             urls: resumeUrls,
  //             method: 'GET',
  //             headers: {
  //               'Content-Type': 'application/json',
  //               'Authorization': 'Kulabrands1#',
  //             },
  //             payload: {
  //               message: 'User confirmed images via Supabase resume_url fetch',
  //             },
  //           }),
  //         });
  //       } catch (err) {
  //         console.error('Lambda resume_url call failed:', err);
  //       }
  //     }
  //   }
  // };

  const confirmProceed = async () => {
    if (!marked.length) {
      setToast('Please select at least one image before proceeding.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
  
    setResubmitting(true);
  
    try {
      const { data: resumeData, error: resumeError } = await supabase
        .from('image_staging_for_review')
        .select('resume_url')
        .eq('session_id', sessionId)
        .neq('resume_url', null)
        .neq('resume_url', '');
      
      console.log('Resume data:', resumeData);
      const idsToDelete = images
        .filter(img => !marked.includes(img.id))
        .map(img => img.id);
      
      console.log('IDs to delete:', idsToDelete);
      if (idsToDelete.length) {
        const { error } = await supabase
          .from('image_staging_for_review')
          .delete()
          .in('id', idsToDelete);
  
        if (error) {
          console.error('Deletion error:', error);
          alert('Failed to delete images');
          return;
        }
      }
  
      const updated = images.filter(img => marked.includes(img.id));
      setImages(updated);
      setMarked([]);
      setCurrent(0);
      setThumbStart(0);
  
      if (resumeError) {
        console.error('Resume URL fetch error:', resumeError);
      } else {
        const resumeUrls = [...new Set(resumeData.map(row => row.resume_url))];
        if (resumeUrls.length) {
          await fetch('https://xg6pqkxzki.execute-api.us-east-1.amazonaws.com/generic-webhook-caller-lambda', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              urls: resumeUrls,
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Kulabrands1#',
              },
              payload: {
                message: 'User confirmed images and started video generation',
              },
            }),
          });
        }
      }
  
      // Redirect to prompt page for video polling
      setToast('🎬 Video generation started! Redirecting...');
      setTimeout(() => {
        window.location.href = '/prompt?mode=video';
      }, 1500);
  
    } catch (err) {
      console.error('Error during proceed flow:', err);
    } finally {
      setResubmitting(false);
    }
  };
  
  const handlePromptResubmit = async (e) => {
    e.preventDefault();
    const promptText = e.target.prompt.value.trim();
    if (!promptText) return;
  
    setResubmitting(true);
  
    try {
      let idsToDelete = [];
  
      if (marked.length > 0) {
        // Delete only unmarked images
        idsToDelete = images.filter(img => !marked.includes(img.id)).map(img => img.id);
      } else {
        // No images marked, delete all
        idsToDelete = images.map(img => img.id);
      }
      
      const { data: resumeData, error: resumeError } = await supabase
        .from('image_staging_for_review')
        .select('resume_url')
        .eq('session_id', sessionId)
        .neq('resume_url', null)
        .neq('resume_url', '')

      if (idsToDelete.length) {
        const { error } = await supabase
          .from('image_staging_for_review')
          .delete()
          .in('id', idsToDelete);
  
        if (error) {
          console.error('Error deleting session images:', error);
          return;
        }
      }
  
      if (resumeError) {
        console.error('Failed to fetch resume URLs:', resumeError);
      } else {
        const resumeUrls = [...new Set(resumeData.map(row => row.resume_url))];
        
        if (resumeUrls.length) {
          try {
            await fetch('https://xg6pqkxzki.execute-api.us-east-1.amazonaws.com/generic-webhook-caller-lambda', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                urls: resumeUrls,
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Kulabrands1#',
                },
                payload: {
                  message: 'User confirmed images via Supabase resume_url fetch',
                },
              }),
            });
          } catch (err) {
            console.error('Lambda resume_url call failed:', err);
          }
        }
      }
  
      await fetch('https://sumhuman.app.n8n.cloud/webhook/3b0e1f5f-3a95-438a-aafe-442270633997', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Kulabrands1#',
        },
        body: JSON.stringify({ prompt: promptText, sessionId }),
      });
  
      setTimeout(() => {
        window.location.href = '/prompt';
      }, 800);
    } catch (err) {
      console.error('Error during prompt resubmission:', err);
    } finally {
      setResubmitting(false);
    }
  };
  
  const handleThumbnailClick = (index) => setCurrent(index);
  const showPrevThumbs = () => setThumbStart(Math.max(0, thumbStart - thumbnailsToShow));
  const showNextThumbs = () => {
    if (thumbStart + thumbnailsToShow < images.length) {
      setThumbStart(thumbStart + thumbnailsToShow);
    }
  };

  const currentImage = images[current];

  return (
    <div className="min-h-screen bg-[#121212] text-white px-4 pb-10">
      <h1 className="text-2xl font-bold text-center py-4">Review Images</h1>

      {resubmitting && (
        <div className="text-center text-green-400 font-medium my-2 animate-pulse">
          Submitting new prompt and cleaning up...
        </div>
      )}
      
      {toast && (
        <div className="flex items-center w-full max-w-xs p-4 mb-4 text-gray-200 bg-[#1e1e1e] rounded-lg shadow-sm mx-auto animate-slideInUp" role="alert">
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-orange-400 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
            </svg>
          </div>
          <div className="ms-3 text-sm font-medium">{toast}</div>
          <button
            onClick={() => setToast('')}
            type="button"
            className="ms-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-white rounded-lg p-1.5 hover:bg-gray-700 inline-flex items-center justify-center h-8 w-8"
            aria-label="Close"
          >
            <svg className="w-3 h-3" aria-hidden="true" fill="none" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
          </button>
        </div>
      )}


      {loading ? (
        <p className="text-center text-gray-400">Loading images...</p>
      ) : images.length ? (
        <>
          <div className="flex-grow flex flex-col items-center gap-6">
            <div className="max-w-4xl w-full">
              <img
                src={currentImage?.image_url}
                alt="Selected"
                className="w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
              />
               {currentImage?.query && (
                  <p className="mt-2 text-sm text-gray-300 italic text-center">
                    Prompt: {currentImage.query}
                  </p>
                )}

              <button
                onClick={toggleDelete}
                className={`w-full mt-4 py-2 rounded-lg font-bold transition duration-150 ease-in-out
                  ${
                    marked.includes(currentImage?.id)
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                      : 'bg-gray-700 text-white hover:bg-gray-600 hover:shadow-md'
                  }
                `}
              >
                {marked.includes(currentImage?.id) ? '💾 Marked to Keep' : '🖼️ Select this Image'}
              </button>

            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={showPrevThumbs}
                disabled={thumbStart === 0}
                className="text-2xl px-2 py-1 border border-gray-500 rounded disabled:opacity-40"
              >
                &#8592;
              </button>
              <div className="grid grid-cols-5 gap-2">
                {images.slice(thumbStart, thumbStart + thumbnailsToShow).map((img, idx) => {
                  const actualIndex = thumbStart + idx;
                  return (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt={`Thumb ${actualIndex}`}
                      onClick={() => handleThumbnailClick(actualIndex)}
                      className={`h-20 w-20 object-cover rounded-lg cursor-pointer border-2 ${
                        actualIndex === current ? 'border-blue-500' : 'border-transparent'
                      }`}
                    />
                  );
                })}
              </div>
              <button
                onClick={showNextThumbs}
                disabled={thumbStart + thumbnailsToShow >= images.length}
                className="text-2xl px-2 py-1 border border-gray-500 rounded disabled:opacity-40"
              >
                &#8594;
              </button>
            </div>
          </div>

          <div className="py-4 text-center">
            <button
              onClick={confirmProceed}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white font-bold"
            >
              Proceed with images ({marked.length})
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 mt-10">No images to review.</p>
      )}

      <div className="py-8 max-w-xl mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Didn't like the images?</h2>
        <form onSubmit={handlePromptResubmit} className="flex flex-col md:flex-row items-center gap-4 justify-center">
          <input
            type="text"
            name="prompt"
            placeholder="Enter new prompt..."
            className="w-full md:w-[400px] bg-[#2a2a2a] text-white px-4 py-3 rounded border border-gray-600 focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded font-bold text-white"
          >
            Submit New Prompt
          </button>
        </form>
      </div>
    </div>
  );
}
