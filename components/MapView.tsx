import React, { useEffect, useRef } from 'react';
import { ItineraryDay, ItineraryItem } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Manually fixing Leaflet's default icon path issues in Webpack/Vite
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const highlightedIconFn = () => new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapViewProps {
    days: ItineraryDay[];
    t: { [key: string]: string };
    selectedItem: ItineraryItem | null;
    onMarkerClick: (item: ItineraryItem) => void;
}

export const MapView: React.FC<MapViewProps> = ({ days, t, selectedItem, onMarkerClick }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    const locations = days.flatMap(day =>
        day.schedule.filter(item => item.latitude != null && item.longitude != null)
    );

    useEffect(() => {
        // Initialize map on component mount
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
        }

        // Cleanup map instance on component unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Update markers when locations change
        if (mapInstance.current) {
            // Clear existing markers from the map
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            if (locations.length > 0) {
                const newMarkers = locations.map(item => {
                    const marker = L.marker([item.latitude!, item.longitude!], {
                        // @ts-ignore
                        itineraryItem: item,
                    })
                        .addTo(mapInstance.current!)
                        .bindPopup(`<b>${item.activity}</b><br>${item.time}`);

                    marker.on('click', () => {
                        onMarkerClick(item);
                    });

                    return marker;
                });

                markersRef.current = newMarkers;

                // Adjust map view to fit all markers
                if (newMarkers.length > 0) {
                    const markerGroup = L.featureGroup(newMarkers);
                    mapInstance.current.fitBounds(markerGroup.getBounds().pad(0.1));
                }
            }
        }
    }, [locations, onMarkerClick]);

    useEffect(() => {
        if (!mapInstance.current || markersRef.current.length === 0) return;

        // Reset all markers to default icon
        markersRef.current.forEach(marker => {
            marker.setIcon(DefaultIcon);
        });

        if (selectedItem?.latitude != null && selectedItem?.longitude != null) {
            const targetMarker = markersRef.current.find(marker => {
                // @ts-ignore
                const markerItem = marker.options.itineraryItem;
                return markerItem.activity === selectedItem.activity &&
                    markerItem.time === selectedItem.time &&
                    markerItem.description === selectedItem.description;
            });

            if (targetMarker) {
                mapInstance.current.flyTo([selectedItem.latitude, selectedItem.longitude], 15, {
                    animate: true,
                    duration: 1
                });
                targetMarker.setIcon(highlightedIconFn());
                targetMarker.openPopup();
            }
        }
    }, [selectedItem]);

    // Don't render the component if there are no locations with coordinates
    if (locations.length === 0) {
        return null;
    }

    return (
        <div className="bg-white p-4 rounded-[2rem] border border-slate-200 mb-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4 ml-2">{t.journeyMap}</h3>
            <div ref={mapRef} style={{ height: '400px', borderRadius: '1.5rem', backgroundColor: '#f1f5f9', overflow: 'hidden' }}></div>
        </div>
    );
};