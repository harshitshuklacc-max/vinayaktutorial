import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_PUBLIC_SETTINGS, INITIAL_INSTITUTE_COURSES } from '../lib/firestoreDb';
import type {
  Course,
  GalleryItem,
  Notice,
  PublicFaculty,
  PublicSettings,
  Testimonial,
} from '../types/domain';

export interface PublicSiteData {
  settings: PublicSettings;
  courses: Course[];
  faculty: PublicFaculty[];
  notices: Notice[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  loading: boolean;
}

export function usePublicSiteData(): PublicSiteData {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_INSTITUTE_COURSES);
  const [faculty, setFaculty] = useState<PublicFaculty[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [setSnap, courseSnap, facSnap, noticeSnap, galSnap, testSnap] = await Promise.all([
          getDoc(doc(db, 'public_settings', 'main')).catch(() => null),
          getDocs(collection(db, 'public_courses')).catch(() => null),
          getDocs(collection(db, 'public_faculty')).catch(() => null),
          getDocs(query(collection(db, 'public_notices'), orderBy('createdAt', 'desc'))).catch(() =>
            getDocs(collection(db, 'public_notices')).catch(() => null)
          ),
          getDocs(query(collection(db, 'public_gallery'), orderBy('createdAt', 'desc'))).catch(() =>
            getDocs(collection(db, 'public_gallery')).catch(() => null)
          ),
          getDocs(collection(db, 'public_testimonials')).catch(() => null),
        ]);

        if (!active) return;

        if (setSnap?.exists()) {
          setSettings({ ...DEFAULT_PUBLIC_SETTINGS, ...(setSnap.data() as Partial<PublicSettings>), id: setSnap.id });
        }
        if (courseSnap && !courseSnap.empty) {
          const list = courseSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Course[];
          setCourses(list.filter((c) => c.isActive !== false));
        }
        if (facSnap) {
          const list = facSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as PublicFaculty[];
          setFaculty(list.filter((f) => f.isActive !== false));
        }
        if (noticeSnap) {
          const list = noticeSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Notice[];
          setNotices(list.filter((n) => n.audience === 'Public' || n.audience === 'All'));
        }
        if (galSnap) {
          setGallery(galSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as GalleryItem[]);
        }
        if (testSnap) {
          const list = testSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Testimonial[];
          setTestimonials(list.filter((t) => t.isApproved));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { settings, courses, faculty, notices, gallery, testimonials, loading };
}
