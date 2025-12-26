// /api/book/[id].js
// Get detailed book information

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const source = pathParts[pathParts.length - 2]; // 'google' or 'openlibrary'
  const id = pathParts[pathParts.length - 1];

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing book ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let book = null;

    if (source === 'google') {
      book = await getGoogleBookDetails(id);
    } else {
      // Assume Open Library key format: /works/OL123W
      book = await getOpenLibraryDetails(id);
    }

    if (!book) {
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ book }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=86400, stale-while-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Book details error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get book details', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function getGoogleBookDetails(id) {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
    
    if (!response.ok) return null;

    const item = await response.json();
    const info = item.volumeInfo;
    const saleInfo = item.saleInfo;

    const isbn = info.industryIdentifiers?.find(
      (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier;

    return {
      id: item.id,
      source: 'google',
      key: `/google/${item.id}`,
      title: info.title,
      subtitle: info.subtitle,
      author: info.authors?.[0] || 'Unknown Author',
      authors: info.authors || [],
      year: info.publishedDate?.split('-')[0],
      publishedDate: info.publishedDate,
      description: info.description,
      isbn,
      pageCount: info.pageCount,
      categories: info.categories || [],
      ratingsAverage: info.averageRating,
      ratingsCount: info.ratingsCount,
      language: info.language,
      publisher: info.publisher,
      coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:'),
      coverUrlLarge: info.imageLinks?.extraLarge?.replace('http:', 'https:') ||
                     info.imageLinks?.large?.replace('http:', 'https:') ||
                     info.imageLinks?.medium?.replace('http:', 'https:'),
      previewLink: info.previewLink,
      infoLink: info.infoLink,
      buyLink: saleInfo?.buyLink,
      isEbook: saleInfo?.isEbook,
      maturityRating: info.maturityRating,
    };
  } catch (error) {
    console.error('Google Book details error:', error);
    return null;
  }
}

async function getOpenLibraryDetails(workKey) {
  try {
    // Ensure proper format
    const key = workKey.startsWith('/works/') ? workKey : `/works/${workKey}`;
    
    const [workResponse, ratingsResponse] = await Promise.all([
      fetch(`https://openlibrary.org${key}.json`),
      fetch(`https://openlibrary.org${key}/ratings.json`),
    ]);

    if (!workResponse.ok) return null;

    const work = await workResponse.json();
    
    let ratings = { average: null, count: 0 };
    if (ratingsResponse.ok) {
      const ratingsData = await ratingsResponse.json();
      ratings = {
        average: ratingsData.summary?.average,
        count: ratingsData.summary?.count || 0,
      };
    }

    // Get author details
    let authors = [];
    if (work.authors?.length > 0) {
      const authorPromises = work.authors.slice(0, 5).map(async (authorRef) => {
        const authorKey = authorRef.author?.key;
        if (!authorKey) return null;
        try {
          const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`);
          if (authorResponse.ok) {
            const author = await authorResponse.json();
            return author.name;
          }
        } catch (e) {
          return null;
        }
        return null;
      });
      authors = (await Promise.all(authorPromises)).filter(Boolean);
    }

    return {
      id: work.key,
      source: 'openlibrary',
      key: work.key,
      title: work.title,
      subtitle: work.subtitle,
      author: authors[0] || 'Unknown Author',
      authors,
      year: work.first_publish_date?.match(/\d{4}/)?.[0],
      firstPublishDate: work.first_publish_date,
      description: typeof work.description === 'string'
        ? work.description
        : work.description?.value,
      subjects: work.subjects || [],
      subjectPlaces: work.subject_places || [],
      subjectTimes: work.subject_times || [],
      subjectPeople: work.subject_people || [],
      ratingsAverage: ratings.average,
      ratingsCount: ratings.count,
      coverUrl: work.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`
        : null,
      coverUrlLarge: work.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg`
        : null,
      infoLink: `https://openlibrary.org${work.key}`,
    };
  } catch (error) {
    console.error('Open Library details error:', error);
    return null;
  }
}
