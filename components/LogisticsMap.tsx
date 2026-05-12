import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Consignment } from '../types';

interface LogisticsMapProps {
  consignments: Consignment[];
}

const ARABIC_COUNTRY_MAP: Record<string, string> = {
  "Afghanistan": "أفغانستان",
  "Albania": "ألبانيا",
  "Algeria": "الجزائر",
  "Andorra": "أندورا",
  "Angola": "أنغولا",
  "Antigua and Barbuda": "أنتيغوا وباربودا",
  "Argentina": "الأرجنتين",
  "Armenia": "أرمينيا",
  "Australia": "أستراليا",
  "Austria": "النمسا",
  "Azerbaijan": "أذربيجان",
  "Bahamas": "جزر البهاما",
  "Bahrain": "البحرين",
  "Bangladesh": "بنغلاديش",
  "Barbados": "بربادوس",
  "Belarus": "بيلاروسيا",
  "Belgium": "بلجيكا",
  "Belize": "بليز",
  "Benin": "بنين",
  "Bhutan": "بوتان",
  "Bolivia": "بوليفيا",
  "Bosnia and Herzegovina": "البوسنة والهرسك",
  "Botswana": "بوتسوانا",
  "Brazil": "البرازيل",
  "Brunei": "بروناي",
  "Bulgaria": "بلغاريا",
  "Burkina Faso": "بوركينا فاسو",
  "Burundi": "بوروندي",
  "Cambodia": "كمبوديا",
  "Cameroon": "الكاميرون",
  "Canada": "كندا",
  "Cape Verde": "الرأس الأخضر",
  "Central African Republic": "جمهورية أفريقيا الوسطى",
  "Chad": "تشاد",
  "Chile": "تشيلي",
  "China": "الصين",
  "Colombia": "كولومبيا",
  "Comoros": "جزر القمر",
  "Congo": "الكونغو",
  "Costa Rica": "كوستاريكا",
  "Croatia": "كرواتيا",
  "Cuba": "كوبا",
  "Cyprus": "قبرص",
  "Czech Republic": "التشيك",
  "Denmark": "الدنمارك",
  "Djibouti": "جيبوتي",
  "Dominica": "دومينيكا",
  "Dominican Republic": "جمهورية الدومينيكان",
  "East Timor": "تيمور الشرقية",
  "Ecuador": "الإكوادور",
  "Egypt": "مصر",
  "El Salvador": "السلفادور",
  "Equatorial Guinea": "غينيا الاستوائية",
  "Eritrea": "إريتريا",
  "Estonia": "إستونيا",
  "Eswatini": "إسواتيني",
  "Ethiopia": "إثيوبيا",
  "Fiji": "فيجي",
  "Finland": "فنلندا",
  "France": "فرنسا",
  "Gabon": "الغابون",
  "Gambia": "غامبيا",
  "Georgia": "جورجيا",
  "Germany": "ألمانيا",
  "Ghana": "غانا",
  "Greece": "اليونان",
  "Grenada": "غرينادا",
  "Guatemala": "غواتيمالا",
  "Guinea": "غينيا",
  "Guinea-Bissau": "غينيا بيساو",
  "Guyana": "غيانا",
  "Haiti": "هايتي",
  "Honduras": "هندوراس",
  "Hungary": "المجر",
  "Iceland": "أيسلندا",
  "India": "الهند",
  "Indonesia": "إندونيسيا",
  "Iran": "إيران",
  "Iraq": "العراق",
  "Ireland": "أيرلندا",
  "Israel": "إسرائيل",
  "Italy": "إيطاليا",
  "Jamaica": "جامايكا",
  "Japan": "اليابان",
  "Jordan": "الأردن",
  "Kazakhstan": "كازاخستان",
  "Kenya": "كينيا",
  "Kiribati": "كيريباتي",
  "North Korea": "كوريا الشمالية",
  "South Korea": "كوريا الجنوبية",
  "Kuwait": "الكويت",
  "Kyrgyzstan": "قرغيزستان",
  "Laos": "لاوس",
  "Latvia": "لاتفيا",
  "Lebanon": "لبنان",
  "Lesotho": "ليسوتو",
  "Liberia": "ليبيريا",
  "Libya": "ليبيا",
  "Liechtenstein": "ليختنشتاين",
  "Lithuania": "ليتوانيا",
  "Luxembourg": "لوكسمبورغ",
  "Madagascar": "مدغشقر",
  "Malawi": "مالاوي",
  "Malaysia": "ماليزيا",
  "Maldives": "جزر المالديف",
  "Mali": "مالي",
  "Malta": "مالطا",
  "Marshall Islands": "جزر مارشال",
  "Mauritania": "موريتانيا",
  "Mauritius": "موريشيوس",
  "Mexico": "المكسيك",
  "Micronesia": "ميكرونيزيا",
  "Moldova": "مولدوفا",
  "Monaco": "موناكو",
  "Mongolia": "منغوليا",
  "Montenegro": "الجبل الأسود",
  "Morocco": "المغرب",
  "Mozambique": "موزمبيق",
  "Myanmar": "ميانمار",
  "Namibia": "ناميبيا",
  "Nauru": "ناورو",
  "Nepal": "نيبال",
  "Netherlands": "هولندا",
  "New Zealand": "نيوزيلندا",
  "Nicaragua": "نيكاراغوا",
  "Niger": "النيجر",
  "Nigeria": "نيجيريا",
  "North Macedonia": "مقدونيا الشمالية",
  "Norway": "النرويج",
  "Oman": "سلطنة عمان",
  "Pakistan": "باكستان",
  "Palau": "بالاو",
  "Palestine": "فلسطين",
  "Panama": "بنما",
  "Papua New Guinea": "بابوا غينيا الجديدة",
  "Paraguay": "باراغواي",
  "Peru": "بيرو",
  "Philippines": "الفلبين",
  "Poland": "بولندا",
  "Portugal": "البرتغال",
  "Qatar": "قطر",
  "Romania": "رومانيا",
  "Russia": "روسيا",
  "Rwanda": "رواندا",
  "Saint Kitts and Nevis": "سانت كيتس ونيفيس",
  "Saint Lucia": "سانت لوسيا",
  "Saint Vincent and the Grenadines": "سانت فنسنت والغرينادين",
  "Samoa": "ساموا",
  "San Marino": "سان مارينو",
  "Sao Tome and Principe": "ساو تومي وبرينسيب",
  "Saudi Arabia": "المملكة العربية السعودية",
  "Senegal": "السنغال",
  "Serbia": "صربيا",
  "Seychelles": "سيشل",
  "Sierra Leone": "سيراليون",
  "Singapore": "سنغافورة",
  "Slovakia": "سلوفاكيا",
  "Slovenia": "سلوفينيا",
  "Solomon Islands": "جزر سليمان",
  "Somalia": "الصومال",
  "South Africa": "جنوب أفريقيا",
  "South Sudan": "جنوب السودان",
  "Spain": "إسبانيا",
  "Sri Lanka": "سيريلانكا",
  "Sudan": "السودان",
  "Suriname": "سورينام",
  "Sweden": "السويد",
  "Switzerland": "سويسرا",
  "Syria": "سوريا",
  "Taiwan": "تايوان",
  "Tajikistan": "طاجيكستان",
  "Tanzania": "تنزانيا",
  "Thailand": "تايلاند",
  "Togo": "توغو",
  "Tonga": "تونغا",
  "Trinidad and Tobago": "ترينيداد وتوباغو",
  "Tunisia": "تونس",
  "Turkey": "تركيا",
  "Turkmenistan": "تركمانستان",
  "Tuvalu": "توفالو",
  "Uganda": "أوغندا",
  "Ukraine": "أوكرانيا",
  "United Arab Emirates": "الإمارات العربية المتحدة",
  "United Kingdom": "المملكة المتحدة",
  "United States of America": "الولايات المتحدة الأمريكية",
  "Uruguay": "أوروغواي",
  "Uzbekistan": "أوزبكستان",
  "Vanuatu": "فانواتو",
  "Vatican City": "الفاتيكان",
  "Venezuela": "فنزويلا",
  "Vietnam": "فيتنام",
  "Yemen": "اليمن",
  "Zambia": "زامبيا",
  "Zimbabwe": "زيمبابوي",
  "United States": "الولايات المتحدة الأمريكية",
  "W. Sahara": "الصحراء الغربية",
  "Dem. Rep. Congo": "جمهورية الكونغو الديمقراطية",
  "Dominican Rep.": "جمهورية الدومينيكان",
  "Falkland Is.": "جزر فوكلاند",
  "Greenland": "جرينلاند",
  "Fr. S. Antarctic Lands": "الأراضي الفرنسية الجنوبية والقطبية",
  "Puerto Rico": "بورتوريكو",
  "Central African Rep.": "جمهورية أفريقيا الوسطى",
  "Eq. Guinea": "غينيا الاستوائية",
  "eSwatini": "إسواتيني",
  "Solomon Is.": "جزر سليمان",
  "S. Sudan": "جنوب السودان",
  "Bosnia and Herz.": "البوسنة والهرسك",
  "Macedonia": "مقدونيا",
  "New Caledonia": "كاليدونيا الجديدة"
};

const LogisticsMap: React.FC<LogisticsMapProps> = ({ consignments }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const countryData = useMemo(() => {
    const counts: Record<string, { incoming: number, outgoing: number }> = {};
    consignments.forEach(c => {
      const isOutgoing = c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير';
      if (c.shippingCountry) {
        if (!counts[c.shippingCountry]) counts[c.shippingCountry] = { incoming: 0, outgoing: 0 };
        if (isOutgoing) counts[c.shippingCountry].outgoing++;
        else counts[c.shippingCountry].incoming++;
      }
    });
    return counts;
  }, [consignments]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 450;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute hidden bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl pointer-events-none z-[300]')
      .style('font-family', 'Tajawal, sans-serif');

    // Load world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries) as any;

      g.selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', (d: any) => {
          const countryName = d.properties.name;
          const arabicName = ARABIC_COUNTRY_MAP[countryName] || countryName;
          const countryStats = Object.entries(countryData).find(([name]) => 
            name.toLowerCase().includes(countryName.toLowerCase()) || 
            countryName.toLowerCase().includes(name.toLowerCase()) ||
            name === arabicName
          )?.[1];

          if (!countryStats) return '#e2e8f0';
          if (countryStats.incoming > 0 && countryStats.outgoing > 0) return '#6366f1'; // Indigo for both
          if (countryStats.outgoing > 0) return '#3b82f6'; // Blue for outgoing
          return '#10b981'; // Emerald for incoming
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('class', 'transition-colors duration-300 cursor-pointer hover:fill-slate-400')
        .on('mouseover', (event, d: any) => {
          const countryName = d.properties.name;
          const arabicName = ARABIC_COUNTRY_MAP[countryName] || countryName;
          const stats = Object.entries(countryData).find(([name]) => 
            name.toLowerCase().includes(countryName.toLowerCase()) || 
            countryName.toLowerCase().includes(name.toLowerCase()) ||
            name === arabicName
          )?.[1];

          const countText = stats 
            ? `${stats.incoming > 0 ? `وارد: ${stats.incoming}` : ''} ${stats.outgoing > 0 ? `صادر: ${stats.outgoing}` : ''}`.trim()
            : 'لا توجد إرساليات';

          tooltip.classed('hidden', false)
            .html(`${arabicName}: ${countText}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
          
          d3.select(event.currentTarget).attr('fill', '#f59e0b'); // Amber on hover
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', (event, d: any) => {
          tooltip.classed('hidden', true);
          const countryName = d.properties.name;
          const arabicName = ARABIC_COUNTRY_MAP[countryName] || countryName;
          const countryStats = Object.entries(countryData).find(([name]) => 
            name.toLowerCase().includes(countryName.toLowerCase()) || 
            countryName.toLowerCase().includes(name.toLowerCase()) ||
            name === arabicName
          )?.[1];

          let fill = '#e2e8f0';
          if (countryStats) {
            if (countryStats.incoming > 0 && countryStats.outgoing > 0) fill = '#6366f1';
            else if (countryStats.outgoing > 0) fill = '#3b82f6';
            else fill = '#10b981';
          }
          d3.select(event.currentTarget).attr('fill', fill);
        });

      // Add Sohar Port Marker
      const soharCoords: [number, number] = [56.74, 24.34]; // Approx coords for Sohar
      const projectedSohar = projection(soharCoords);
      if (projectedSohar) {
        g.append('circle')
          .attr('cx', projectedSohar[0])
          .attr('cy', projectedSohar[1])
          .attr('r', 4)
          .attr('fill', '#10b981')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('class', 'animate-pulse');
        
        g.append('text')
          .attr('x', projectedSohar[0] + 8)
          .attr('y', projectedSohar[1] + 4)
          .attr('text-anchor', 'start')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#1e293b')
          .text('ميناء صحار');
      }
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    return () => {
      tooltip.remove();
    };
  }, [countryData]);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm">
            <i className="fas fa-globe-americas"></i>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm">خارطة الإمداد اللوجستي</h3>
            <p className="text-[10px] text-slate-400 font-bold">تتبع مصادر الشحنات الواردة والوجهات الصادرة عالمياً</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-[10px] font-bold text-slate-500">بلد منشأ (وارد)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                <span className="text-[10px] font-bold text-slate-500">بلد وجهة (صادر)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#6366f1]"></div>
                <span className="text-[10px] font-bold text-slate-500">كلاهما</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981] ring-2 ring-white ring-offset-1"></div>
                <span className="text-[10px] font-bold text-slate-500">ميناء صحار</span>
            </div>
        </div>
      </div>
      
      <div className="relative bg-slate-50 rounded-3xl border border-slate-100 cursor-move overflow-hidden">
        <svg 
          ref={svgRef} 
          viewBox="0 0 800 450" 
          className="w-full h-auto"
        />
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100" onClick={() => {
                const svg = d3.select(svgRef.current);
                svg.transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
            }}>
                <i className="fas fa-compress-arrows-alt"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default LogisticsMap;
